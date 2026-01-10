const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');

/**
 * GET /api/users/:id
 * Get user profile
 */
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'SELECT * FROM user_profiles WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: result.rows[0] });

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/users/:id/recipes
 * Get user's recipes
 */
router.get('/:id/recipes', async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT r.*, rs.avg_rating, rs.rating_count
             FROM recipes r
             LEFT JOIN recipe_stats rs ON r.id = rs.id
             WHERE r.author_id = $1
             ORDER BY r.created_at DESC`,
            [id]
        );

        res.json({ recipes: result.rows });

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/users/leaderboard
 * Get judge leaderboard
 */
router.get('/leaderboard', async (req, res, next) => {
    try {
        const result = await pool.query(
            'SELECT * FROM judge_leaderboard LIMIT 100'
        );

        res.json({ leaderboard: result.rows });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
