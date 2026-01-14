const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { generateToken } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', authLimiter, validate(schemas.register), async (req, res, next) => {
    const client = await pool.connect();

    try {
        const { username, email, password, bio, skillLevel } = req.body;

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        await client.query('BEGIN');

        // Insert user
        const userResult = await client.query(
            `INSERT INTO users (username, email, password_hash, bio, skill_level)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, username, email, bio, skill_level, created_at`,
            [username, email, passwordHash, bio, skillLevel || 'beginner']
        );

        const user = userResult.rows[0];

        await client.query('COMMIT');

        // Generate token
        const token = generateToken({
            id: user.id,
            username: user.username,
            judgeLevel: 'Beginner Taster'
        });

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                bio: user.bio,
                skillLevel: user.skill_level,
                createdAt: user.created_at
            },
            token
        });

    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', authLimiter, validate(schemas.login), async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Get user with judge profile
        const result = await pool.query(
            `SELECT u.id, u.username, u.email, u.password_hash, u.bio, u.skill_level,
                    jp.level AS judge_level, jp.credibility_score
             FROM users u
             LEFT JOIN judge_profiles jp ON u.id = jp.user_id
             WHERE u.email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid credentials'
            });
        }

        const user = result.rows[0];

        // Verify password
        const isValid = await bcrypt.compare(password, user.password_hash);

        if (!isValid) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid credentials'
            });
        }

        // Generate token
        const token = generateToken({
            id: user.id,
            username: user.username,
            judgeLevel: user.judge_level
        });

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                bio: user.bio,
                skillLevel: user.skill_level,
                judgeLevel: user.judge_level,
                credibilityScore: user.credibility_score
            },
            token
        });

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
const { authenticate } = require('../middleware/auth');

router.get('/me', authenticate, async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT u.id, u.username, u.email, u.bio, u.skill_level,
                    jp.level AS judge_level, jp.credibility_score, jp.verified_reviews_count
             FROM users u
             LEFT JOIN judge_profiles jp ON u.id = jp.user_id
             WHERE u.id = $1`,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'User not found'
            });
        }

        const user = result.rows[0];

        res.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                bio: user.bio,
                skillLevel: user.skill_level,
                judgeLevel: user.judge_level,
                credibilityScore: user.credibility_score,
                verifiedReviewsCount: user.verified_reviews_count
            }
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
