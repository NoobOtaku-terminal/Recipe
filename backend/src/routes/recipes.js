const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { generalLimiter } = require('../middleware/rateLimiter');

/**
 * GET /api/recipes
 * List recipes with filtering
 */
router.get('/', generalLimiter, validate(schemas.recipeFilters, 'query'), async (req, res, next) => {
    try {
        const { isVeg, difficulty, cuisineId, maxCookTime, minCalories, maxCalories, sortBy, page, limit } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT r.*, rs.avg_rating, rs.rating_count, rs.comment_count, rs.author_name
            FROM recipe_stats rs
            JOIN recipes r ON rs.id = r.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 0;

        if (isVeg !== undefined) {
            params.push(isVeg);
            query += ` AND r.is_veg = $${++paramCount}`;
        }

        if (difficulty) {
            params.push(difficulty);
            query += ` AND r.difficulty_claimed = $${++paramCount}`;
        }

        if (maxCookTime) {
            params.push(maxCookTime);
            query += ` AND r.cook_time_minutes <= $${++paramCount}`;
        }

        if (cuisineId) {
            params.push(cuisineId);
            query += ` AND EXISTS (
                SELECT 1 FROM recipe_cuisines rc 
                WHERE rc.recipe_id = r.id AND rc.cuisine_id = $${++paramCount}
            )`;
        }

        if (minCalories) {
            params.push(minCalories);
            query += ` AND r.calories >= $${++paramCount}`;
        }

        if (maxCalories) {
            params.push(maxCalories);
            query += ` AND r.calories <= $${++paramCount}`;
        }

        // Sorting
        switch (sortBy) {
            case 'rating':
                query += ' ORDER BY rs.avg_rating DESC, rs.rating_count DESC';
                break;
            case 'trending':
                query += ' ORDER BY rs.created_at DESC';
                break;
            default:
                query += ' ORDER BY r.created_at DESC';
        }

        params.push(limit, offset);
        query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;

        const result = await pool.query(query, params);

        res.json({
            recipes: result.rows,
            pagination: {
                page,
                limit,
                hasMore: result.rows.length === limit
            }
        });

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/recipes/:id
 * Get recipe details
 */
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        // Get recipe with stats
        const recipeResult = await pool.query(
            `SELECT r.*, rs.avg_rating, rs.rating_count, rs.comment_count, rs.author_name
             FROM recipes r
             LEFT JOIN recipe_stats rs ON r.id = rs.id
             WHERE r.id = $1`,
            [id]
        );

        if (recipeResult.rows.length === 0) {
            return res.status(404).json({ error: 'Recipe not found' });
        }

        const recipe = recipeResult.rows[0];

        // Get ingredients
        const ingredientsResult = await pool.query(
            `SELECT i.id, i.name, ri.quantity
             FROM recipe_ingredients ri
             JOIN ingredients i ON ri.ingredient_id = i.id
             WHERE ri.recipe_id = $1
             ORDER BY i.name`,
            [id]
        );

        // Get steps
        const stepsResult = await pool.query(
            `SELECT id, step_no, instruction
             FROM recipe_steps
             WHERE recipe_id = $1
             ORDER BY step_no`,
            [id]
        );

        // Get cuisines
        const cuisinesResult = await pool.query(
            `SELECT c.id, c.name
             FROM recipe_cuisines rc
             JOIN cuisines c ON rc.cuisine_id = c.id
             WHERE rc.recipe_id = $1`,
            [id]
        );

        // Get media
        const mediaResult = await pool.query(
            `SELECT m.id, m.url, m.media_type
             FROM recipe_media rm
             JOIN media m ON rm.media_id = m.id
             WHERE rm.recipe_id = $1`,
            [id]
        );

        res.json({
            recipe: {
                ...recipe,
                ingredients: ingredientsResult.rows.map(ing => ({
                    ...ing,
                    ingredient_id: ing.id
                })),
                steps: stepsResult.rows,
                cuisines: cuisinesResult.rows,
                cuisine_ids: cuisinesResult.rows.map(c => c.id),
                media: mediaResult.rows
            }
        });

    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/recipes
 * Create a new recipe
 */
router.post('/', authenticate, validate(schemas.createRecipe), async (req, res, next) => {
    const client = await pool.connect();

    try {
        const { title, description, difficulty, cookTime, isVeg, calories, cuisineIds, ingredients, steps } = req.body;

        await client.query('BEGIN');

        // Insert recipe
        const recipeResult = await client.query(
            `INSERT INTO recipes (author_id, title, description, difficulty_claimed, cook_time_minutes, is_veg, calories)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [req.user.id, title, description, difficulty, cookTime, isVeg, calories]
        );

        const recipe = recipeResult.rows[0];

        // Insert cuisines
        for (const cuisineId of cuisineIds) {
            await client.query(
                'INSERT INTO recipe_cuisines (recipe_id, cuisine_id) VALUES ($1, $2)',
                [recipe.id, cuisineId]
            );
        }

        // Insert ingredients
        for (const ing of ingredients) {
            let ingredientId = ing.ingredientId;

            // Create ingredient if name provided
            if (!ingredientId && ing.name) {
                const ingResult = await client.query(
                    'INSERT INTO ingredients (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
                    [ing.name]
                );
                ingredientId = ingResult.rows[0].id;
            }

            await client.query(
                'INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES ($1, $2, $3)',
                [recipe.id, ingredientId, ing.quantity]
            );
        }

        // Insert steps
        for (const step of steps) {
            await client.query(
                'INSERT INTO recipe_steps (recipe_id, step_no, instruction) VALUES ($1, $2, $3)',
                [recipe.id, step.stepNo, step.instruction]
            );
        }

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Recipe created successfully',
            recipe
        });

    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
});

/**
 * PUT /api/recipes/:id
 * Update recipe (owner only)
 */
router.put('/:id', authenticate, validate(schemas.updateRecipe), async (req, res, next) => {
    const client = await pool.connect();

    try {
        const { id } = req.params;
        const { title, description, difficulty, cookTime, isVeg, calories, cuisines, cuisineIds, ingredients, steps } = req.body;
        
        // Support both cuisines and cuisineIds for compatibility
        const cuisineList = cuisines || cuisineIds || [];

        await client.query('BEGIN');

        // Check ownership
        const ownerCheck = await client.query(
            'SELECT author_id FROM recipes WHERE id = $1',
            [id]
        );

        if (ownerCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Recipe not found' });
        }

        if (ownerCheck.rows[0].author_id !== req.user.id) {
            await client.query('ROLLBACK');
            return res.status(403).json({ error: 'Forbidden', message: 'You can only edit your own recipes' });
        }

        // Update recipe basic info
        await client.query(
            `UPDATE recipes 
             SET title = $1, description = $2, difficulty_claimed = $3, 
                 cook_time_minutes = $4, is_veg = $5, calories = $6, updated_at = NOW()
             WHERE id = $7`,
            [title, description, difficulty, cookTime, isVeg, calories, id]
        );

        // Update cuisines (delete old, insert new)
        if (cuisineList && cuisineList.length > 0) {
            await client.query('DELETE FROM recipe_cuisines WHERE recipe_id = $1', [id]);

            for (const cuisineId of cuisineList) {
                await client.query(
                    'INSERT INTO recipe_cuisines (recipe_id, cuisine_id) VALUES ($1, $2)',
                    [id, cuisineId]
                );
            }
        }

        // Update ingredients (delete old, insert new)
        if (ingredients && ingredients.length > 0) {
            await client.query('DELETE FROM recipe_ingredients WHERE recipe_id = $1', [id]);

            for (const ing of ingredients) {
                let ingredientId = ing.id;

                if (!ingredientId && ing.name) {
                    const ingResult = await client.query(
                        'INSERT INTO ingredients (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
                        [ing.name]
                    );
                    ingredientId = ingResult.rows[0].id;
                }

                await client.query(
                    'INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES ($1, $2, $3)',
                    [id, ingredientId, ing.quantity]
                );
            }
        }

        // Update steps (delete old, insert new)
        if (steps && steps.length > 0) {
            await client.query('DELETE FROM recipe_steps WHERE recipe_id = $1', [id]);

            for (const step of steps) {
                await client.query(
                    'INSERT INTO recipe_steps (recipe_id, step_no, instruction) VALUES ($1, $2, $3)',
                    [id, step.stepNo, step.instruction]
                );
            }
        }

        await client.query('COMMIT');

        res.json({
            message: 'Recipe updated successfully',
            recipeId: id
        });

    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
});

/**
 * DELETE /api/recipes/:id
 * Delete recipe (owner only)
 */
router.delete('/:id', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM recipes WHERE id = $1 AND author_id = $2 RETURNING id',
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Recipe not found or unauthorized' });
        }

        res.json({ message: 'Recipe deleted successfully' });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
