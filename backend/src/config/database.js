const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Log connection events
pool.on('connect', () => {
    logger.debug('New database connection established');
});

pool.on('error', (err) => {
    logger.error('Unexpected database error:', err);
    process.exit(-1);
});

// Test connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        logger.error('Database connection test failed:', err);
    } else {
        logger.info('✅ Database connected successfully');
    }
});

module.exports = { pool };
