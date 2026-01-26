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

        // Simple, bulletproof query - only basic user table
        const userResult = await pool.query(
            'SELECT id, username, email, bio, skill_level, created_at, updated_at FROM users WHERE id = $1',
            [id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userResult.rows[0];

        // Get XP fields if they exist
        try {
            const xpResult = await pool.query(
                'SELECT experience_points, level, level_name FROM users WHERE id = $1',
                [id]
            );
            if (xpResult.rows[0].experience_points !== undefined) {
                user.experience_points = xpResult.rows[0].experience_points || 0;
                user.level = xpResult.rows[0].level || 1;
                user.level_name = xpResult.rows[0].level_name || 'beginner';
                
                // Calculate progress
                const xp = user.experience_points;
                const lvl = user.level;
                if (lvl === 1) user.level_progress_percent = Math.round((xp * 100.0 / 100) * 100) / 100;
                else if (lvl === 2) user.level_progress_percent = Math.round(((xp - 100) * 100.0 / 200) * 100) / 100;
                else if (lvl === 3) user.level_progress_percent = Math.round(((xp - 300) * 100.0 / 400) * 100) / 100;
                else if (lvl === 4) user.level_progress_percent = Math.round(((xp - 700) * 100.0 / 800) * 100) / 100;
                else if (lvl === 5) user.level_progress_percent = Math.round(((xp - 1500) * 100.0 / 1500) * 100) / 100;
                else user.level_progress_percent = 0;
            }
        } catch (e) {
            // XP columns don't exist, use defaults
            user.experience_points = 0;
            user.level = 1;
            user.level_name = 'beginner';
            user.level_progress_percent = 0;
        }

        // Get stats
        const statsResult = await pool.query(
            'SELECT COUNT(*) as count FROM recipes WHERE author_id = $1',
            [id]
        );
        user.recipes_created = parseInt(statsResult.rows[0].count) || 0;

        try {
            const battlesResult = await pool.query(
                'SELECT COUNT(DISTINCT be.battle_id) as count FROM battle_entries be JOIN recipes r ON be.recipe_id = r.id WHERE r.author_id = $1',
                [id]
            );
            user.battles_entered = parseInt(battlesResult.rows[0].count) || 0;
        } catch (e) {
            user.battles_entered = 0;
        }

        try {
            const votesResult = await pool.query(
                'SELECT COUNT(*) as count FROM battle_votes bv JOIN battle_entries be ON bv.battle_id = be.battle_id JOIN recipes r ON be.recipe_id = r.id WHERE r.author_id = $1',
                [id]
            );
            user.votes_received = parseInt(votesResult.rows[0].count) || 0;
        } catch (e) {
            user.votes_received = 0;
        }

        try {
            const commentsResult = await pool.query(
                'SELECT COUNT(*) as count FROM comments c JOIN recipes r ON c.recipe_id = r.id WHERE r.author_id = $1',
                [id]
            );
            user.comments_received = parseInt(commentsResult.rows[0].count) || 0;
        } catch (e) {
            user.comments_received = 0;
        }

        // Get judge info if exists
        try {
            const judgeResult = await pool.query(
                'SELECT level, credibility_score FROM judge_profiles WHERE user_id = $1',
                [id]
            );
            if (judgeResult.rows.length > 0) {
                user.judge_level = judgeResult.rows[0].level || 'Beginner Taster';
                user.credibility_score = judgeResult.rows[0].credibility_score || 0;
                user.judge_level_num = user.judge_level === 'Master Critic' ? 3 : user.judge_level === 'Home Chef' ? 2 : 1;
            } else {
                user.judge_level = 'Beginner Taster';
                user.credibility_score = 0;
                user.judge_level_num = 1;
            }
        } catch (e) {
            user.judge_level = 'Beginner Taster';
            user.credibility_score = 0;
            user.judge_level_num = 1;
        }

        res.json({ user });

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
