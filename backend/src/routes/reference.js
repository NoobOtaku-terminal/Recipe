const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

/**
 * GET /api/cuisines
 * Get all cuisines
 */
router.get('/cuisines', async (req, res, next) => {
    try {
        const result = await pool.query(
            'SELECT id, name FROM cuisines ORDER BY name ASC'
        );

        res.json({ cuisines: result.rows });

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/ingredients
 * Get all ingredients
 */
router.get('/ingredients', async (req, res, next) => {
    try {
        const result = await pool.query(
            'SELECT id, name FROM ingredients ORDER BY name ASC'
        );

        res.json({ ingredients: result.rows });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
