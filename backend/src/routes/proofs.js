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

// Helper functions
async function calculateFileHash(filePath) {
    const fileBuffer = await fs.readFile(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
}

async function deleteFile(filePath) {
    try {
        await fs.unlink(filePath);
    } catch (error) {
        logger.error('Failed to delete file', { filePath, error: error.message });
    }
}

/**
 * POST /api/proofs/upload
 * Upload video proof for battle vote
 */
router.post('/upload', authenticate, upload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No video file uploaded' });
        }

        const { battleId, recipeId, notes } = req.body;

        if (!battleId || !recipeId) {
            await deleteFile(req.file.path);
            return res.status(400).json({ error: 'Battle ID and Recipe ID are required' });
        }

        // Check if battle exists and is active (use computed status)
        const battleResult = await pool.query(
            `SELECT 
                CASE 
                    WHEN NOW() >= ends_at THEN 'closed'
                    WHEN NOW() >= starts_at AND NOW() < ends_at THEN 'active'
                    WHEN NOW() < starts_at THEN 'upcoming'
                    ELSE status
                END AS current_status,
                ends_at
            FROM battles WHERE id = $1`,
            [battleId]
        );

        if (battleResult.rows.length === 0) {
            await deleteFile(req.file.path);
            return res.status(404).json({ error: 'Battle not found' });
        }

        const battle = battleResult.rows[0];
        if (battle.current_status !== 'active') {
            await deleteFile(req.file.path);
            return res.status(400).json({ 
                error: `Battle is not active (current status: ${battle.current_status})` 
            });
        }

        if (new Date(battle.ends_at) < new Date()) {
            await deleteFile(req.file.path);
            return res.status(400).json({ error: 'Battle has ended' });
        }

        // Check if recipe exists in battle
        const entryResult = await pool.query(
            'SELECT 1 FROM battle_entries WHERE battle_id = $1 AND recipe_id = $2',
            [battleId, recipeId]
        );

        if (entryResult.rows.length === 0) {
            await deleteFile(req.file.path);
            return res.status(400).json({ error: 'Recipe is not entered in this battle' });
        }

        // Calculate video hash
        const videoHash = await calculateFileHash(req.file.path);

        // Check for duplicate video
        const duplicateResult = await pool.query(
            'SELECT id FROM media WHERE video_hash = $1 AND uploaded_by != $2',
            [videoHash, req.user.id]
        );

        if (duplicateResult.rows.length > 0) {
            await deleteFile(req.file.path);
            return res.status(400).json({
                error: 'This video has already been uploaded by another user. Please submit original content.'
            });
        }

        const ipAddress = req.ip || req.connection.remoteAddress;
        const relativePath = `/uploads/proofs/${path.basename(req.file.path)}`;

        // Start transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Insert media record (duration_seconds can be NULL)
            const mediaResult = await client.query(
                `INSERT INTO media 
                (url, media_type, file_size_bytes, mime_type, uploaded_by, upload_ip, video_hash) 
                VALUES ($1, 'video', $2, $3, $4, $5, $6) 
                RETURNING id`,
                [relativePath, req.file.size, req.file.mimetype, req.user.id, ipAddress, videoHash]
            );

            const mediaId = mediaResult.rows[0].id;

            // Check if user already voted
            const existingVoteResult = await client.query(
                'SELECT proof_media_id FROM battle_votes WHERE battle_id = $1 AND user_id = $2',
                [battleId, req.user.id]
            );

            // Get user level for auto-approval
            const userResult = await client.query('SELECT level FROM users WHERE id = $1', [req.user.id]);
            const userLevel = userResult.rows[0]?.level || 1;
            const autoApproved = userLevel >= 4;

            if (existingVoteResult.rows.length > 0) {
                // Update existing vote
                await client.query(
                    `UPDATE battle_votes 
                    SET proof_media_id = $1, recipe_id = $2, notes = $3, 
                        verified = $4, proof_verified_at = CASE WHEN $4 THEN NOW() ELSE NULL END
                    WHERE battle_id = $5 AND user_id = $6`,
                    [mediaId, recipeId, notes, autoApproved, battleId, req.user.id]
                );
            } else {
                // Create new vote
                await client.query(
                    `INSERT INTO battle_votes 
                    (battle_id, user_id, recipe_id, proof_media_id, notes, verified, proof_verified_at)
                    VALUES ($1, $2, $3, $4, $5, $6, CASE WHEN $6 THEN NOW() ELSE NULL END)`,
                    [battleId, req.user.id, recipeId, mediaId, notes, autoApproved]
                );
            }

            await client.query('COMMIT');

            res.status(201).json({
                success: true,
                message: autoApproved
                    ? 'Video proof uploaded and automatically verified! Your vote has been counted.'
                    : 'Video proof uploaded successfully! Pending admin verification.',
                proof: {
                    mediaId,
                    url: relativePath,
                    size: req.file.size,
                    autoApproved,
                    requiresVerification: !autoApproved
                }
            });

        } catch (error) {
            await client.query('ROLLBACK');
            await deleteFile(req.file.path);
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        logger.error('Video proof upload failed', {
            userId: req.user?.id,
            error: error.message,
            stack: error.stack,
            battleId: req.body?.battleId,
            recipeId: req.body?.recipeId
        });

        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: `Video file too large. Maximum size is ${MAX_VIDEO_SIZE / 1024 / 1024}MB`
            });
        }

        res.status(500).json({
            error: 'Failed to upload video proof',
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

/**
 * GET /api/proofs/pending
 * Get pending proof verifications (admin only)
 */
router.get('/pending', authenticate, async (req, res) => {
    try {
        const userResult = await pool.query(
            'SELECT is_admin, is_moderator FROM users WHERE id = $1',
            [req.user.id]
        );

        if (!userResult.rows[0]?.is_admin && !userResult.rows[0]?.is_moderator) {
            return res.status(403).json({ error: 'Access denied. Admin/Moderator only.' });
        }

        const query = `
            SELECT 
                bv.battle_id,
                bv.user_id,
                bv.recipe_id,
                bv.proof_media_id,
                bv.notes,
                bv.created_at as proof_submitted_at,
                EXTRACT(EPOCH FROM (NOW() - bv.created_at)) / 3600 as hours_pending,
                u.username,
                u.level,
                r.title as recipe_title,
                b.dish_name,
                m.url as proof_video_url,
                m.media_type,
                m.file_size_bytes,
                m.duration_seconds
            FROM battle_votes bv
            JOIN users u ON bv.user_id = u.id
            JOIN recipes r ON bv.recipe_id = r.id
            JOIN battles b ON bv.battle_id = b.id
            LEFT JOIN media m ON bv.proof_media_id = m.id
            WHERE bv.verified = FALSE AND bv.proof_media_id IS NOT NULL
            ORDER BY bv.created_at ASC
        `;

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
 * POST /api/proofs/verify
 * Verify or reject a battle proof (admin only)
 */
router.post('/verify', authenticate, async (req, res) => {
    try {
        const { battleId, userId, approved, notes } = req.body;

        if (!battleId || !userId || approved === undefined) {
            return res.status(400).json({
                error: 'Battle ID, User ID, and approval status are required'
            });
        }

        const userResult = await pool.query(
            'SELECT is_admin, is_moderator FROM users WHERE id = $1',
            [req.user.id]
        );

        if (!userResult.rows[0]?.is_admin && !userResult.rows[0]?.is_moderator) {
            return res.status(403).json({ error: 'Access denied. Admin/Moderator only.' });
        }

        if (approved) {
            // Approve the proof
            await pool.query(
                `UPDATE battle_votes 
                SET verified = TRUE, proof_verified_at = NOW(), verified_by = $1
                WHERE battle_id = $2 AND user_id = $3`,
                [req.user.id, battleId, userId]
            );

            res.json({
                success: true,
                message: 'Proof verified successfully'
            });
        } else {
            // Reject the proof - just unverify, keep the proof_media_id so admin can see it
            await pool.query(
                `UPDATE battle_votes 
                SET verified = FALSE, proof_verified_at = NULL, verified_by = NULL
                WHERE battle_id = $1 AND user_id = $2`,
                [battleId, userId]
            );

            res.json({
                success: true,
                message: 'Proof rejected. User will need to re-upload.'
            });
        }

    } catch (error) {
        logger.error('Failed to verify proof', { error: error.message });
        res.status(500).json({ error: 'Failed to verify proof' });
    }
});

module.exports = router;
