const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');

/**
 * Admin middleware - checks if user is admin
 */
const requireAdmin = (req, res, next) => {
    if (!req.user.isAdmin && !req.user.is_admin) {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Admin access required'
        });
    }
    next();
};

/**
 * Log admin actions
 */
async function logAdminAction(adminId, action, targetType, targetId, details, ip) {
    try {
        await pool.query(
            `INSERT INTO admin_logs (admin_id, action, target_type, target_id, details, ip_address)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [adminId, action, targetType, targetId, JSON.stringify(details), ip]
        );
    } catch (error) {
        console.error('Failed to log admin action:', error);
    }
}

// Apply authentication and admin check to all routes
router.use(authenticate, requireAdmin);

/**
 * GET /api/admin/stats
 * Get platform statistics
 */
router.get('/stats', async (req, res, next) => {
    try {
        const stats = await pool.query('SELECT * FROM admin_statistics');
        res.json({
            data: {
                stats: stats.rows
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/admin/users
 * List all users with filters
 */
router.get('/users', async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search, flagged } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT u.*, jp.level AS judge_level, jp.credibility_score,
                   COUNT(DISTINCT r.id) AS recipe_count,
                   COUNT(DISTINCT ra.recipe_id) AS rating_count
            FROM users u
            LEFT JOIN judge_profiles jp ON u.id = jp.user_id
            LEFT JOIN recipes r ON u.id = r.author_id
            LEFT JOIN ratings ra ON u.id = ra.user_id
            WHERE 1=1
        `;

        const params = [];
        let paramCount = 1;

        if (search) {
            query += ` AND (u.username ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
            params.push(`%${search}%`);
            paramCount++;
        }

        query += ` GROUP BY u.id, jp.level, jp.credibility_score
                   ORDER BY u.created_at DESC
                   LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);
        const countResult = await pool.query('SELECT COUNT(*) FROM users');

        res.json({
            data: {
                users: result.rows,
                pagination: {
                    total: parseInt(countResult.rows[0].count),
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total_pages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
                }
            }
        });

    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/admin/users/:id
 * Update user (ban, promote to admin, etc.)
 */
router.put('/users/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { isAdmin, isModerator, isBanned } = req.body;

        const updates = [];
        const params = [id];
        let paramCount = 2;

        if (typeof isAdmin === 'boolean') {
            updates.push(`is_admin = $${paramCount}`);
            params.push(isAdmin);
            paramCount++;
        }

        if (typeof isModerator === 'boolean') {
            updates.push(`is_moderator = $${paramCount}`);
            params.push(isModerator);
            paramCount++;
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No updates provided' });
        }

        const result = await pool.query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
            params
        );

        await logAdminAction(
            req.user.id,
            'UPDATE_USER',
            'user',
            id,
            { isAdmin, isModerator },
            req.ip
        );

        res.json({
            message: 'User updated successfully',
            user: result.rows[0]
        });

    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/admin/users/:id
 * Delete a user
 */
router.delete('/users/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        // Prevent self-deletion
        if (id === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        await pool.query('DELETE FROM users WHERE id = $1', [id]);

        await logAdminAction(
            req.user.id,
            'DELETE_USER',
            'user',
            id,
            {},
            req.ip
        );

        res.json({ message: 'User deleted successfully' });

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/admin/recipes/flagged
 * Get flagged recipes for moderation
 */
router.get('/recipes/flagged', async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT r.*, u.username AS author_name, rs.avg_rating
             FROM recipes r
             JOIN users u ON r.author_id = u.id
             LEFT JOIN recipe_stats rs ON r.id = rs.id
             WHERE r.is_flagged = TRUE
             ORDER BY r.updated_at DESC
             LIMIT 50`
        );

        res.json({ recipes: result.rows });

    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/admin/recipes/:id/moderate
 * Moderate a recipe (approve/reject/flag)
 */
router.put('/recipes/:id/moderate', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { isApproved, isFlagged, moderationNotes } = req.body;

        const result = await pool.query(
            `UPDATE recipes 
             SET is_approved = $1, is_flagged = $2, moderation_notes = $3
             WHERE id = $4
             RETURNING *`,
            [isApproved, isFlagged, moderationNotes, id]
        );

        await logAdminAction(
            req.user.id,
            'MODERATE_RECIPE',
            'recipe',
            id,
            { isApproved, isFlagged, moderationNotes },
            req.ip
        );

        res.json({
            message: 'Recipe moderated successfully',
            recipe: result.rows[0]
        });

    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/admin/recipes/:id
 * Delete a recipe
 */
router.delete('/recipes/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        await pool.query('DELETE FROM recipes WHERE id = $1', [id]);

        await logAdminAction(
            req.user.id,
            'DELETE_RECIPE',
            'recipe',
            id,
            {},
            req.ip
        );

        res.json({ message: 'Recipe deleted successfully' });

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/admin/battles
 * Get all battles with stats
 */
router.get('/battles', async (req, res, next) => {
    try {
        // Query the tables directly instead of relying on a potentially empty view
        const result = await pool.query(`
            SELECT 
                b.id,
                b.dish_name,
                b.description,
                b.rules,
                b.starts_at,
                b.ends_at,
                b.creator_id,
                b.created_at,
                b.updated_at,
                CASE 
                    WHEN NOW() >= b.ends_at THEN 'closed'
                    WHEN NOW() >= b.starts_at AND NOW() < b.ends_at THEN 'active'
                    WHEN NOW() < b.starts_at THEN 'upcoming'
                    ELSE b.status
                END AS status,
                u.username as creator_name,
                (SELECT COUNT(*) FROM battle_entries WHERE battle_id = b.id) as entry_count,
                (SELECT COUNT(*) FROM battle_votes WHERE battle_id = b.id) as total_votes
            FROM battles b
            LEFT JOIN users u ON b.creator_id = u.id
            ORDER BY b.created_at DESC
        `);

        res.json({
            data: {
                battles: result.rows
            }
        });

    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/admin/battles/:id
 * Update battle status
 */
router.put('/battles/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['upcoming', 'active', 'closed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const result = await pool.query(
            'UPDATE battles SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );

        await logAdminAction(
            req.user.id,
            'UPDATE_BATTLE_STATUS',
            'battle',
            id,
            { status },
            req.ip
        );

        res.json({
            message: 'Battle status updated successfully',
            battle: result.rows[0]
        });

    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/admin/battles/:id
 * Delete a battle
 */
router.delete('/battles/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        await pool.query('DELETE FROM battles WHERE id = $1', [id]);

        await logAdminAction(
            req.user.id,
            'DELETE_BATTLE',
            'battle',
            id,
            {},
            req.ip
        );

        res.json({ message: 'Battle deleted successfully' });

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/admin/logs
 * Get admin activity logs
 */
router.get('/logs', async (req, res, next) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        const result = await pool.query(
            `SELECT al.*, u.username AS admin_name
             FROM admin_logs al
             LEFT JOIN users u ON al.admin_id = u.id
             ORDER BY al.created_at DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        const countResult = await pool.query('SELECT COUNT(*) FROM admin_logs');

        res.json({
            logs: result.rows,
            pagination: {
                total: parseInt(countResult.rows[0].count),
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
            }
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
