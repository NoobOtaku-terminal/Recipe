const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

/**
 * POST /api/comments
 * Create a comment
 */
router.post('/', authenticate, validate(schemas.createComment), async (req, res, next) => {
    try {
        const { recipeId, parentId, content } = req.body;

        // Verify recipe exists
        const recipeCheck = await pool.query(
            'SELECT id FROM recipes WHERE id = $1',
            [recipeId]
        );

        if (recipeCheck.rows.length === 0) {
            return res.status(404).json({ 
                error: 'Not Found',
                message: 'Recipe not found' 
            });
        }

        const result = await pool.query(
            `INSERT INTO comments (recipe_id, user_id, parent_id, content)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [recipeId, req.user.id, parentId || null, content]
        );

        res.status(201).json({
            message: 'Comment created successfully',
            comment: result.rows[0]
        });

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/comments/recipe/:recipeId
 * Get comments for a recipe
 */
router.get('/recipe/:recipeId', async (req, res, next) => {
    try {
        const { recipeId } = req.params;

        const result = await pool.query(
            `SELECT c.id, c.recipe_id, c.user_id, c.parent_id, c.content, 
                    c.is_verified, c.created_at, u.username
             FROM comments c
             JOIN users u ON c.user_id = u.id
             WHERE c.recipe_id = $1
             ORDER BY c.created_at ASC`,
            [recipeId]
        );

        res.json({ comments: result.rows });

    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/comments/:id/verify
 * Mark comment as verified (with proof)
 */
router.post('/:id/verify', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `UPDATE comments
             SET is_verified = true
             WHERE id = $1 AND user_id = $2
             RETURNING *`,
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Comment not found or unauthorized' });
        }

        res.json({
            message: 'Comment verified successfully',
            comment: result.rows[0]
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
