const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');

/**
 * POST /api/likes
 * Like or dislike a recipe
 */
router.post('/', authenticate, async (req, res, next) => {
    try {
        const { recipeId, isLike } = req.body;

        if (typeof isLike !== 'boolean') {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'isLike must be a boolean (true for like, false for dislike)'
            });
        }

        // Check if recipe exists and user is not the author
        const recipeCheck = await pool.query(
            'SELECT author_id FROM recipes WHERE id = $1',
            [recipeId]
        );

        if (recipeCheck.rows.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Recipe not found'
            });
        }

        if (recipeCheck.rows[0].author_id === req.user.id) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You cannot like or dislike your own recipe'
            });
        }

        const result = await pool.query(
            `INSERT INTO recipe_likes (user_id, recipe_id, is_like)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id, recipe_id) 
             DO UPDATE SET is_like = $3, updated_at = NOW()
             RETURNING *`,
            [req.user.id, recipeId, isLike]
        );

        res.status(201).json({
            message: isLike ? 'Recipe liked successfully' : 'Recipe disliked successfully',
            like: result.rows[0]
        });

    } catch (error) {
        // Check for self-like error from trigger
        if (error.message && (error.message.includes('cannot like/dislike their own recipes') || error.message.includes('cannot like their own recipes'))) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You cannot like or dislike your own recipe'
            });
        }
        next(error);
    }
});

/**
 * DELETE /api/likes/:recipeId
 * Remove like/dislike from a recipe
 */
router.delete('/:recipeId', authenticate, async (req, res, next) => {
    try {
        const { recipeId } = req.params;

        const result = await pool.query(
            'DELETE FROM recipe_likes WHERE user_id = $1 AND recipe_id = $2 RETURNING *',
            [req.user.id, recipeId]
        );

        if (result.rows.length === 0) {
            return res.status(200).json({
                message: 'No like/dislike found to remove',
                removed: false
            });
        }

        res.json({
            message: 'Like/dislike removed successfully',
            removed: true
        });

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/likes/recipe/:recipeId
 * Get like/dislike stats for a recipe
 */
router.get('/recipe/:recipeId', async (req, res, next) => {
    try {
        const { recipeId } = req.params;

        const result = await pool.query(
            `SELECT 
                COUNT(CASE WHEN is_like = TRUE THEN 1 END) AS like_count,
                COUNT(CASE WHEN is_like = FALSE THEN 1 END) AS dislike_count,
                COUNT(*) AS total_reactions
             FROM recipe_likes
             WHERE recipe_id = $1`,
            [recipeId]
        );

        res.json(result.rows[0]);

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/likes/recipe/:recipeId/mine
 * Get current user's like/dislike for a recipe
 */
router.get('/recipe/:recipeId/mine', authenticate, async (req, res, next) => {
    try {
        const { recipeId } = req.params;

        const result = await pool.query(
            'SELECT is_like, created_at, updated_at FROM recipe_likes WHERE user_id = $1 AND recipe_id = $2',
            [req.user.id, recipeId]
        );

        if (result.rows.length === 0) {
            return res.json({ hasReacted: false, isLike: null });
        }

        res.json({
            hasReacted: true,
            isLike: result.rows[0].is_like,
            createdAt: result.rows[0].created_at
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
