const { pool } = require('../config/database');
const logger = require('./logger');

/**
 * Update battle statuses based on current time
 * Called periodically to ensure battles transition between upcoming/active/closed
 */
async function updateBattleStatuses() {
    try {
        await pool.query('SELECT update_battle_statuses()');
        logger.debug('Battle statuses updated successfully');
    } catch (error) {
        logger.error('Failed to update battle statuses:', error);
    }
}

/**
 * Start periodic battle status updates
 * Runs every 5 minutes
 */
function startBattleStatusUpdater() {
    // Run immediately on startup
    updateBattleStatuses();
    
    // Then run every 5 minutes (300000ms)
    const interval = setInterval(updateBattleStatuses, 5 * 60 * 1000);
    
    logger.info('Battle status auto-updater started (runs every 5 minutes)');
    
    // Cleanup function
    return () => {
        clearInterval(interval);
        logger.info('Battle status auto-updater stopped');
    };
}

module.exports = {
    updateBattleStatuses,
    startBattleStatusUpdater
};
