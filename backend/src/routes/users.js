const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');

/**
 * GET /api/users/leaderboard
 * Get judge leaderboard
 * NOTE: Must be before /:id route to avoid matching "leaderboard" as an ID
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

/**
 * GET /api/users/:id
 * Get user profile
 */
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT u.id, u.username, u.bio, u.created_at,
                    COALESCE(up.xp, 0) as experience_points, 
                    COALESCE(up.level, 1) as level, 
                    COALESCE(up.level_name, 'beginner') as level_name, 
                    COALESCE(up.level_progress_percent, 0) as level_progress_percent,
                    COALESCE(up.recipes_created, 0) as recipes_created,
                    COALESCE(up.battles_entered, 0) as battles_entered,
                    COALESCE(up.votes_received, 0) as votes_received,
                    COALESCE(up.comments_received, 0) as comments_received,
                    COALESCE(jp.credibility_score, 0) as credibility_score, 
                    COALESCE(jp.level, 1) AS judge_level_num,
                    CASE WHEN jp.level IS NULL THEN 'Beginner Taster' ELSE jp.level || ' ' || 'Taster' END as judge_level
             FROM users u
             LEFT JOIN user_progression up ON u.id = up.id
             LEFT JOIN judge_profiles jp ON u.id = jp.user_id
             WHERE u.id = $1`,
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

module.exports = router;
