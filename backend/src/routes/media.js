const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = file.fieldname === 'proof'
            ? path.join(process.env.MEDIA_UPLOAD_PATH || './uploads', 'proofs')
            : path.join(process.env.MEDIA_UPLOAD_PATH || './uploads', 'file');
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Only images (JPEG, PNG, GIF) and videos (MP4, MOV, AVI, WebM) are allowed'));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB limit for video proofs
    }
});

/**
 * POST /api/media/upload
 * Upload media file
 */
router.post('/upload', authenticate, uploadLimiter, upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const mediaType = req.file.mimetype.startsWith('image') ? 'image' : 'video';

        // Determine the subdirectory based on fieldname
        const subdir = req.file.fieldname === 'proof' ? 'proofs' : 'file';
        const url = `/uploads/${subdir}/${req.file.filename}`;

        const result = await pool.query(
            'INSERT INTO media (url, media_type, uploaded_by) VALUES ($1, $2, $3) RETURNING *',
            [url, mediaType, req.user.id]
        );

        res.status(201).json({
            message: 'File uploaded successfully',
            media: result.rows[0]
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
