const express = require('express');
const router = express.Router();
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;
const { authenticate } = require('../middleware/auth');
const { pool } = require('../config/database');
const logger = require('../utils/logger');

// Video validation constants
const MAX_VIDEO_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_DURATION = 60; // 60 seconds
const ALLOWED_MIME_TYPES = [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo'
];
const ALLOWED_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi'];

// Configure multer for video uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(process.env.MEDIA_UPLOAD_PATH || './uploads', 'proofs');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `proof-${req.user.id}-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return cb(new Error('Invalid file type. Only MP4, WebM, MOV, and AVI are allowed.'));
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(new Error('Invalid MIME type. Only video files are allowed.'));
    }

    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_VIDEO_SIZE
    }
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate SHA256 hash of file for duplicate detection
 */
async function calculateFileHash(filePath) {
    const fileBuffer = await fs.readFile(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
}

/**
 * Get video duration using ffprobe (requires ffmpeg installation)
 */
async function getVideoDuration(filePath) {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execPromise = promisify(exec);

    try {
        const { stdout } = await execPromise(
            `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`
        );
        return Math.round(parseFloat(stdout.trim()));
    } catch (error) {
        logger.warn('ffprobe not available, skipping duration check', { error: error.message });
        return 0; // Return 0 if ffprobe not available
    }
}

/**
 * Delete uploaded file
 */
async function deleteFile(filePath) {
    try {
        await fs.unlink(filePath);
    } catch (error) {
        logger.error('Failed to delete file', { filePath, error: error.message });
    }
}

// =============================================================================
// ROUTES
// =============================================================================

/**
 * @route   POST /api/proofs/upload
 * @desc    Upload video proof for battle vote
 * @access  Private
 */
router.post('/upload', authenticate, upload.single('video'), async (req, res) => {
    const client = await db.pool.getConnection();

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No video file uploaded' });
        }

        const { battleId, recipeId, notes } = req.body;

        // Validate required fields
        if (!battleId || !recipeId) {
            await deleteFile(req.file.path);
            return res.status(400).json({ error: 'Battle ID and Recipe ID are required' });
        }

        // Check if battle exists and is active
        const battleQuery = 'SELECT status, ends_at FROM battles WHERE id = ?';
        const [battles] = await client.query(battleQuery, [battleId]);

        if (battles.length === 0) {
            await deleteFile(req.file.path);
            return res.status(404).json({ error: 'Battle not found' });
        }

        if (battles[0].status !== 'active') {
            await deleteFile(req.file.path);
            return res.status(400).json({ error: 'Battle is not active' });
        }

        if (new Date(battles[0].ends_at) < new Date()) {
            await deleteFile(req.file.path);
            return res.status(400).json({ error: 'Battle has ended' });
        }

        // Check if recipe exists in battle
        const entryQuery = 'SELECT 1 FROM battle_entries WHERE battle_id = ? AND recipe_id = ?';
        const [entries] = await client.query(entryQuery, [battleId, recipeId]);

        if (entries.length === 0) {
            await deleteFile(req.file.path);
            return res.status(400).json({ error: 'Recipe is not entered in this battle' });
        }

        // Calculate video hash for duplicate detection
        const videoHash = await calculateFileHash(req.file.path);

        // Check for duplicate video
        const duplicateQuery = 'SELECT id FROM media WHERE video_hash = ? AND uploaded_by != ?';
        const [duplicates] = await client.query(duplicateQuery, [videoHash, req.user.id]);

        if (duplicates.length > 0) {
            await deleteFile(req.file.path);
            return res.status(400).json({
                error: 'This video has already been uploaded by another user. Please submit original content.'
            });
        }

        // Get video duration (optional - requires ffmpeg)
        let duration = 0;
        try {
            duration = await getVideoDuration(req.file.path);

            if (duration > MAX_DURATION) {
                await deleteFile(req.file.path);
                return res.status(400).json({
                    error: `Video duration must be under ${MAX_DURATION} seconds (your video: ${duration}s)`
                });
            }
        } catch (error) {
            logger.warn('Could not verify video duration', { error: error.message });
        }

        // Get user's IP address
        const ipAddress = req.ip || req.connection.remoteAddress;

        await client.beginTransaction();

        try {
            // Insert media record
            const mediaQuery = `
        INSERT INTO media 
        (url, media_type, file_size_bytes, duration_seconds, mime_type, uploaded_by, upload_ip, video_hash) 
        VALUES (?, 'video', ?, ?, ?, ?, ?, ?)
      `;

            const relativePath = `/uploads/proofs/${path.basename(req.file.path)}`;
            const [mediaResult] = await client.query(mediaQuery, [
                relativePath,
                req.file.size,
                duration,
                req.file.mimetype,
                req.user.id,
                ipAddress,
                videoHash
            ]);

            const mediaId = mediaResult.insertId;

            // Check if user already voted
            const existingVoteQuery = 'SELECT proof_media_id FROM battle_votes WHERE battle_id = ? AND user_id = ?';
            const [existingVotes] = await client.query(existingVoteQuery, [battleId, req.user.id]);

            if (existingVotes.length > 0) {
                // Update existing vote with new proof
                const updateVoteQuery = `
          UPDATE battle_votes 
          SET proof_media_id = ?, 
              recipe_id = ?, 
              notes = ?,
              proof_submitted_at = NOW(),
              verified = CASE 
                WHEN (SELECT level FROM users WHERE id = ?) >= 4 THEN TRUE 
                ELSE FALSE 
              END,
              proof_verified_at = CASE 
                WHEN (SELECT level FROM users WHERE id = ?) >= 4 THEN NOW() 
                ELSE NULL 
              END
          WHERE battle_id = ? AND user_id = ?
        `;
                await client.query(updateVoteQuery, [
                    mediaId, recipeId, notes, req.user.id, req.user.id, battleId, req.user.id
                ]);
            } else {
                // Create new vote with proof
                const insertVoteQuery = `
          INSERT INTO battle_votes 
          (battle_id, user_id, recipe_id, proof_media_id, notes, proof_submitted_at, verified, proof_verified_at)
          VALUES (?, ?, ?, ?, ?, NOW(), 
            CASE WHEN (SELECT level FROM users WHERE id = ?) >= 4 THEN TRUE ELSE FALSE END,
            CASE WHEN (SELECT level FROM users WHERE id = ?) >= 4 THEN NOW() ELSE NULL END
          )
        `;
                await client.query(insertVoteQuery, [
                    battleId, req.user.id, recipeId, mediaId, notes, req.user.id, req.user.id
                ]);
            }

            await client.commit();

            // Get user level to determine auto-approval
            const [users] = await client.query('SELECT level FROM users WHERE id = ?', [req.user.id]);
            const userLevel = users[0]?.level || 1;
            const autoApproved = userLevel >= 4;

            res.status(201).json({
                success: true,
                message: autoApproved
                    ? 'Video proof uploaded and automatically verified! Your vote has been counted.'
                    : 'Video proof uploaded successfully! Pending admin verification.',
                proof: {
                    mediaId,
                    url: relativePath,
                    size: req.file.size,
                    duration,
                    autoApproved,
                    requiresVerification: !autoApproved
                }
            });

        } catch (error) {
            await client.rollback();
            await deleteFile(req.file.path);
            throw error;
        }

    } catch (error) {
        logger.error('Video proof upload failed', {
            userId: req.user?.id,
            error: error.message,
            stack: error.stack
        });

        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: `Video file too large. Maximum size is ${MAX_VIDEO_SIZE / 1024 / 1024}MB`
            });
        }

        res.status(500).json({
            error: 'Failed to upload video proof',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        client.release();
    }
});

/**
 * @route   GET /api/proofs/pending
 * @desc    Get pending proof verifications (admin only)
 * @access  Private (Admin/Moderator)
 */
router.get('/pending', authenticate, async (req, res) => {
    try {
        // Check admin/moderator permission
        const userResult = await pool.query('SELECT is_admin, is_moderator FROM users WHERE id = $1', [req.user.id]);

        if (!userResult.rows[0]?.is_admin && !userResult.rows[0]?.is_moderator) {
            return res.status(403).json({ error: 'Access denied. Admin/Moderator only.' });
        }

        const query = 'SELECT * FROM pending_proof_verifications ORDER BY proof_submitted_at ASC';
        const proofsResult = await pool.query(query);

        res.json({
            success: true,
            count: proofsResult.rows.length,
            proofs: proofsResult.rows
        });

    } catch (error) {
        logger.error('Failed to fetch pending proofs', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch pending proofs' });
    }
});

/**
 * @route   POST /api/proofs/verify
 * @desc    Verify or reject a battle proof (admin only)
 * @access  Private (Admin/Moderator)
 */
router.post('/verify', authenticate, async (req, res) => {
    try {
        const { battleId, userId, approved, notes } = req.body;

        // Validate required fields
        if (!battleId || !userId || approved === undefined) {
            return res.status(400).json({
                error: 'Battle ID, User ID, and approval status are required'
            });
        }

        // Check admin/moderator permission
        const userResult = await pool.query('SELECT is_admin, is_moderator FROM users WHERE id = $1', [req.user.id]);

        if (!userResult.rows[0]?.is_admin && !userResult.rows[0]?.is_moderator) {
            return res.status(403).json({ error: 'Access denied. Admin/Moderator only.' });
        }

        // Call verification function
        const query = 'SELECT verify_battle_proof($1, $2, $3, $4, $5) AS result';
        await pool.query(query, [battleId, userId, req.user.id, approved, notes || null]);

        res.json({
            success: true,
            message: approved ? 'Proof approved successfully' : 'Proof rejected',
            action: approved ? 'approved' : 'rejected'
        });

    } catch (error) {
        logger.error('Failed to verify proof', { error: error.message });
        res.status(500).json({
            error: 'Failed to verify proof',
            details: error.message
        });
    }
});

/**
 * @route   GET /api/proofs/my-proofs
 * @desc    Get current user's submitted proofs
 * @access  Private
 */
router.get('/my-proofs', authenticate, async (req, res) => {
    try {
        const query = `
      SELECT 
        bv.battle_id,
        b.dish_name,
        bv.recipe_id,
        r.title AS recipe_title,
        m.url AS proof_url,
        m.file_size_bytes,
        m.duration_seconds,
        bv.verified,
        bv.proof_submitted_at,
        bv.proof_verified_at,
        bv.notes,
        u_verifier.username AS verified_by_username
      FROM battle_votes bv
      JOIN battles b ON bv.battle_id = b.id
      JOIN recipes r ON bv.recipe_id = r.id
      LEFT JOIN media m ON bv.proof_media_id = m.id
      LEFT JOIN users u_verifier ON bv.verified_by = u_verifier.id
      WHERE bv.user_id = ?
      AND bv.proof_media_id IS NOT NULL
      ORDER BY bv.proof_submitted_at DESC
    `;

        const [proofs] = await db.query(query, [req.user.id]);

        res.json({
            success: true,
            count: proofs.length,
            proofs
        });

    } catch (error) {
        logger.error('Failed to fetch user proofs', {
            userId: req.user.id,
            error: error.message
        });
        res.status(500).json({ error: 'Failed to fetch proofs' });
    }
});

/**
 * @route   POST /api/proofs/finalize-battle/:battleId
 * @desc    Finalize battle and calculate winners (admin only)
 * @access  Private (Admin)
 */
router.post('/finalize-battle/:battleId', authenticate, async (req, res) => {
    try {
        const { battleId } = req.params;

        // Check admin permission
        const [users] = await db.query('SELECT is_admin FROM users WHERE id = ?', [req.user.id]);

        if (!users[0]?.is_admin) {
            return res.status(403).json({ error: 'Access denied. Admin only.' });
        }

        // Call finalize function
        await db.query('SELECT finalize_battle(?) AS result', [battleId]);

        // Get results
        const [results] = await db.query(
            'SELECT * FROM battle_winners_detailed WHERE battle_id = ?',
            [battleId]
        );

        res.json({
            success: true,
            message: 'Battle finalized successfully',
            results: results[0]
        });

    } catch (error) {
        logger.error('Failed to finalize battle', { error: error.message });
        res.status(500).json({
            error: 'Failed to finalize battle',
            details: error.message
        });
    }
});

module.exports = router;
