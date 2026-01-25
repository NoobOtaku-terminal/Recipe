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
                    COALESCE(u.experience_points, 0) as experience_points, 
                    COALESCE(u.level, 1) as level, 
                    COALESCE(u.level_name, 'beginner') as level_name,
                    CASE 
                        WHEN u.level = 1 THEN ROUND((COALESCE(u.experience_points, 0) * 100.0 / 100), 2)
                        WHEN u.level = 2 THEN ROUND(((COALESCE(u.experience_points, 0) - 100) * 100.0 / 200), 2)
                        WHEN u.level = 3 THEN ROUND(((COALESCE(u.experience_points, 0) - 300) * 100.0 / 400), 2)
                        WHEN u.level = 4 THEN ROUND(((COALESCE(u.experience_points, 0) - 700) * 100.0 / 800), 2)
                        WHEN u.level = 5 THEN ROUND(((COALESCE(u.experience_points, 0) - 1500) * 100.0 / 1500), 2)
                        ELSE 0
                    END as level_progress_percent,
                    (SELECT COUNT(*) FROM recipes WHERE author_id = u.id) as recipes_created,
                    (SELECT COUNT(DISTINCT be.battle_id) FROM battle_entries be WHERE be.recipe_id IN (SELECT id FROM recipes WHERE author_id = u.id)) as battles_entered,
                    (SELECT COUNT(*) FROM battle_votes bv JOIN battle_entries be ON bv.battle_id = be.battle_id WHERE be.recipe_id IN (SELECT id FROM recipes WHERE author_id = u.id)) as votes_received,
                    (SELECT COUNT(*) FROM comments WHERE recipe_id IN (SELECT id FROM recipes WHERE author_id = u.id)) as comments_received,
                    COALESCE(jp.credibility_score, 0) as credibility_score, 
                    COALESCE(jp.level, 1) AS judge_level_num,
                    CASE WHEN jp.level IS NULL THEN 'Beginner Taster' ELSE jp.level || ' ' || 'Taster' END as judge_level
             FROM users u
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
 * PUT /api/users/:id
 * Update user profile (own profile only)
 */
router.put('/:id', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { bio } = req.body;

        // Check if user is updating their own profile
        if (req.user.id !== id) {
            return res.status(403).json({ error: 'You can only update your own profile' });
        }

        // Update user bio
        const result = await pool.query(
            'UPDATE users SET bio = $1, updated_at = NOW() WHERE id = $2 RETURNING id, username, bio',
            [bio, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            message: 'Profile updated successfully',
            user: result.rows[0]
        });

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
