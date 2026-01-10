const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

/**
 * POST /api/ratings
 * Rate a recipe
 */
router.post('/', authenticate, validate(schemas.createRating), async (req, res, next) => {
    try {
        const { recipeId, rating } = req.body;

        const result = await pool.query(
            `INSERT INTO ratings (user_id, recipe_id, rating)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id, recipe_id) 
             DO UPDATE SET rating = $3, created_at = NOW()
             RETURNING *`,
            [req.user.id, recipeId, rating]
        );

        res.status(201).json({
            message: 'Rating submitted successfully',
            rating: result.rows[0]
        });

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/ratings/recipe/:recipeId
 * Get all ratings for a recipe
 */
router.get('/recipe/:recipeId', async (req, res, next) => {
    try {
        const { recipeId } = req.params;

        const result = await pool.query(
            `SELECT r.rating, r.created_at, u.username, jp.level AS judge_level
             FROM ratings r
             JOIN users u ON r.user_id = u.id
             LEFT JOIN judge_profiles jp ON u.id = jp.user_id
             WHERE r.recipe_id = $1
             ORDER BY r.created_at DESC`,
            [recipeId]
        );

        res.json({ ratings: result.rows });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
