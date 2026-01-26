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

        // First, check which columns exist
        const columnsCheck = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name IN ('experience_points', 'level', 'level_name')
        `);

        const existingColumns = columnsCheck.rows.map(row => row.column_name);
        const hasXP = existingColumns.includes('experience_points');
        const hasLevel = existingColumns.includes('level');
        const hasLevelName = existingColumns.includes('level_name');

        // Build query based on available columns
        let query = `SELECT u.id, u.username, u.bio, u.created_at`;

        if (hasXP) {
            query += `, u.experience_points`;
        } else {
            query += `, 0 as experience_points`;
        }

        if (hasLevel) {
            query += `, u.level`;
        } else {
            query += `, 1 as level`;
        }

        if (hasLevelName) {
            query += `, u.level_name`;
        } else {
            query += `, 'beginner' as level_name`;
        }

        // Calculate progress percentage
        if (hasXP && hasLevel) {
            query += `,
                CASE 
                    WHEN u.level = 1 THEN ROUND((u.experience_points * 100.0 / 100), 2)
                    WHEN u.level = 2 THEN ROUND(((u.experience_points - 100) * 100.0 / 200), 2)
                    WHEN u.level = 3 THEN ROUND(((u.experience_points - 300) * 100.0 / 400), 2)
                    WHEN u.level = 4 THEN ROUND(((u.experience_points - 700) * 100.0 / 800), 2)
                    WHEN u.level = 5 THEN ROUND(((u.experience_points - 1500) * 100.0 / 1500), 2)
                    ELSE 0
                END as level_progress_percent`;
        } else {
            query += `, 0 as level_progress_percent`;
        }

        // Add stats
        query += `,
                (SELECT COUNT(*) FROM recipes WHERE author_id = u.id) as recipes_created,
                (SELECT COUNT(DISTINCT be.battle_id) FROM battle_entries be WHERE be.recipe_id IN (SELECT id FROM recipes WHERE author_id = u.id)) as battles_entered,
                (SELECT COUNT(*) FROM battle_votes bv JOIN battle_entries be ON bv.battle_id = be.battle_id WHERE be.recipe_id IN (SELECT id FROM recipes WHERE author_id = u.id)) as votes_received,
                (SELECT COUNT(*) FROM comments WHERE recipe_id IN (SELECT id FROM recipes WHERE author_id = u.id)) as comments_received,
                COALESCE(jp.credibility_score, 0) as credibility_score, 
                COALESCE(jp.level, 'Beginner Taster') AS judge_level,
                CASE 
                    WHEN jp.level = 'Master Critic' THEN 3
                    WHEN jp.level = 'Home Chef' THEN 2
                    ELSE 1
                END as judge_level_num
         FROM users u
         LEFT JOIN judge_profiles jp ON u.id = jp.user_id
         WHERE u.id = $1`;

        const result = await pool.query(query, [id]);

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
