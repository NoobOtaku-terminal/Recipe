const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

/**
 * GET /api/battles
 * List all battles with entry count
 */
router.get('/', async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT 
                b.id AS battle_id,
                b.dish_name,
                b.status,
                b.starts_at,
                b.ends_at,
                b.creator_id,
                u.username AS creator_name,
                COUNT(DISTINCT be.recipe_id) AS entry_count,
                COUNT(DISTINCT bv.user_id) AS total_votes
             FROM battles b
             LEFT JOIN battle_entries be ON b.id = be.battle_id
             LEFT JOIN battle_votes bv ON b.id = bv.battle_id
             LEFT JOIN users u ON b.creator_id = u.id
             GROUP BY b.id, b.dish_name, b.status, b.starts_at, b.ends_at, b.creator_id, u.username
             ORDER BY b.starts_at DESC
             LIMIT 50`
        );

        res.json({ battles: result.rows });

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/battles/:id
 * Get battle details with entry count
 */
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT 
                b.id AS battle_id,
                b.dish_name,
                b.status,
                b.starts_at,
                b.ends_at,
                b.creator_id,
                u.username AS creator_name,
                COUNT(DISTINCT be.recipe_id) AS entry_count,
                COUNT(DISTINCT bv.user_id) AS total_votes
             FROM battles b
             LEFT JOIN battle_entries be ON b.id = be.battle_id
             LEFT JOIN battle_votes bv ON b.id = bv.battle_id
             LEFT JOIN users u ON b.creator_id = u.id
             WHERE b.id = $1
             GROUP BY b.id, b.dish_name, b.status, b.starts_at, b.ends_at, b.creator_id, u.username`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Battle not found' });
        }

        res.json({ battle: result.rows[0] });

    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/battles/:id/enter
 * Enter a recipe into a battle
 */
router.post('/:id/enter', authenticate, validate(schemas.battleEntry), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { recipeId } = req.body;

        // Check if battle is active
        const battleCheck = await pool.query(
            'SELECT status FROM battles WHERE id = $1',
            [id]
        );

        if (battleCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Battle not found' });
        }

        if (battleCheck.rows[0].status !== 'active' && battleCheck.rows[0].status !== 'upcoming') {
            return res.status(400).json({ error: 'Battle is closed for entries' });
        }

        // Check if user owns the recipe
        const recipeCheck = await pool.query(
            'SELECT author_id FROM recipes WHERE id = $1',
            [recipeId]
        );

        if (recipeCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Recipe not found' });
        }

        if (recipeCheck.rows[0].author_id !== req.user.id) {
            return res.status(403).json({ error: 'You can only enter your own recipes' });
        }

        // Insert battle entry
        const result = await pool.query(
            `INSERT INTO battle_entries (battle_id, recipe_id)
             VALUES ($1, $2)
             ON CONFLICT (battle_id, recipe_id) DO NOTHING
             RETURNING *`,
            [id, recipeId]
        );

        res.status(201).json({
            message: 'Recipe entered in battle successfully',
            entry: result.rows[0]
        });

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/battles/:id/entries
 * Get all entries for a battle
 */
router.get('/:id/entries', async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT 
                r.id, r.title, r.description, r.difficulty_claimed,
                r.cook_time_minutes, r.is_veg,
                u.id AS author_id, u.username AS author_name,
                COUNT(DISTINCT bv.user_id) AS vote_count,
                COUNT(DISTINCT CASE WHEN bv.verified THEN bv.user_id END) AS verified_vote_count
             FROM battle_entries be
             JOIN recipes r ON be.recipe_id = r.id
             JOIN users u ON r.author_id = u.id
             LEFT JOIN battle_votes bv ON bv.battle_id = be.battle_id AND bv.recipe_id = r.id
             WHERE be.battle_id = $1
             GROUP BY r.id, u.id, u.username
             ORDER BY vote_count DESC, r.created_at ASC`,
            [id]
        );

        res.json({ entries: result.rows });

    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/battles/:id/vote
 * Vote in a battle (requires proof of cooking)
 */
router.post('/:id/vote', authenticate, validate(schemas.battleVote), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { recipeId, proofMediaId, notes } = req.body;

        // Check if battle is active
        const battleCheck = await pool.query(
            'SELECT status, ends_at FROM battles WHERE id = $1',
            [id]
        );

        if (battleCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Battle not found' });
        }

        if (battleCheck.rows[0].status !== 'active') {
            return res.status(400).json({ error: 'Battle is not active for voting' });
        }

        if (new Date(battleCheck.rows[0].ends_at) < new Date()) {
            return res.status(400).json({ error: 'Battle has ended' });
        }

        // Check if recipe is entered in this battle
        const entryCheck = await pool.query(
            'SELECT 1 FROM battle_entries WHERE battle_id = $1 AND recipe_id = $2',
            [id, recipeId]
        );

        if (entryCheck.rows.length === 0) {
            return res.status(400).json({ error: 'Recipe is not entered in this battle' });
        }

        // Check if media proof exists and belongs to user
        const mediaCheck = await pool.query(
            'SELECT 1 FROM media WHERE id = $1 AND uploaded_by = $2',
            [proofMediaId, req.user.id]
        );

        if (mediaCheck.rows.length === 0) {
            return res.status(400).json({
                error: 'Invalid proof media. Please upload a photo/video of your cooking attempt first.'
            });
        }

        // Cannot vote for own recipe
        const recipeCheck = await pool.query(
            'SELECT author_id FROM recipes WHERE id = $1',
            [recipeId]
        );

        if (recipeCheck.rows[0].author_id === req.user.id) {
            return res.status(400).json({ error: 'You cannot vote for your own recipe' });
        }

        // Insert or update vote
        const result = await pool.query(
            `INSERT INTO battle_votes (battle_id, user_id, recipe_id, proof_media_id, notes)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (battle_id, user_id)
             DO UPDATE SET 
                recipe_id = $3, 
                proof_media_id = $4, 
                notes = $5,
                created_at = NOW()
             RETURNING *`,
            [id, req.user.id, recipeId, proofMediaId, notes]
        );

        res.status(201).json({
            message: 'Vote recorded successfully with proof of cooking!',
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
/**
 * POST /api/battles
 * Create a new battle (admin only)
 */
router.post('/', authenticate, requireAdmin, validate(schemas.createBattle), async (req, res, next) => {
    try {
        const { dishName, startsAt, endsAt } = req.body;

        const result = await pool.query(
            `INSERT INTO battles (dish_name, starts_at, ends_at, status, creator_id)
             VALUES ($1, $2, $3, 'upcoming', $4)
             RETURNING *`,
            [dishName, startsAt, endsAt, req.user.id]
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
