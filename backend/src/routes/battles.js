const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

/**
 * GET /api/battles
 * List all battles
 */
router.get('/', async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT * FROM battle_results
             ORDER BY starts_at DESC
             LIMIT 50`
        );

        res.json({ battles: result.rows });

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/battles/:id
 * Get battle details
 */
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT * FROM battle_results WHERE battle_id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Battle not found' });
        }

        res.json({ battle: result.rows });

    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/battles/:id/vote
 * Vote in a battle
 */
router.post('/:id/vote', authenticate, validate(schemas.battleVote), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { recipeId } = req.body;

        const result = await pool.query(
            `INSERT INTO battle_votes (battle_id, user_id, recipe_id)
             VALUES ($1, $2, $3)
             ON CONFLICT (battle_id, user_id)
             DO UPDATE SET recipe_id = $3, created_at = NOW()
             RETURNING *`,
            [id, req.user.id, recipeId]
        );

        res.status(201).json({
            message: 'Vote recorded successfully',
            vote: result.rows[0]
        });

    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/battles
 * Create a new battle (admin/judge only)
 */
router.post('/', authenticate, validate(schemas.createBattle), async (req, res, next) => {
    try {
        const { dishName, startsAt, endsAt } = req.body;

        const result = await pool.query(
            `INSERT INTO battles (dish_name, starts_at, ends_at, status)
             VALUES ($1, $2, $3, 'upcoming')
             RETURNING *`,
            [dishName, startsAt, endsAt]
        );

        res.status(201).json({
            message: 'Battle created successfully',
            battle: result.rows[0]
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
