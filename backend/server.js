require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

const logger = require('./src/utils/logger');
const { pool } = require('./src/config/database');
const errorHandler = require('./src/middleware/errorHandler');
const { startBattleStatusUpdater } = require('./src/utils/battleStatusUpdater');

// Import routes
const authRoutes = require('./src/routes/auth');
const recipeRoutes = require('./src/routes/recipes');
const ratingRoutes = require('./src/routes/ratings');
const commentRoutes = require('./src/routes/comments');
const battleRoutes = require('./src/routes/battles');
const userRoutes = require('./src/routes/users');
const mediaRoutes = require('./src/routes/media');
const referenceRoutes = require('./src/routes/reference');
const adminRoutes = require('./src/routes/admin');
const proofRoutes = require('./src/routes/proofs');
const likeRoutes = require('./src/routes/likes');

const app = express();
const PORT = process.env.PORT || 3000;

// =============================================================================
// MIDDLEWARE
// =============================================================================

// Trust proxy - Required when behind Nginx/reverse proxy
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// CORS Configuration
// Support multiple origins (comma-separated in env)
const corsOrigins = process.env.CORS_ORIGIN || '*';
const allowedOrigins = corsOrigins === '*' ? '*' : corsOrigins.split(',').map(o => o.trim());

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, Postman, curl)
        if (!origin) return callback(null, true);

        // Allow all origins if CORS_ORIGIN=*
        if (allowedOrigins === '*') return callback(null, true);

        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            logger.warn(`CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Compression
app.use(compression());

// Body parsing with error handling
app.use(express.json({
    limit: '10mb',
    verify: (req, res, buf, encoding) => {
        try {
            JSON.parse(buf);
        } catch (e) {
            logger.error('Invalid JSON:', e.message);
            throw new Error('Invalid JSON');
        }
    }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging - Always log to console for docker logs
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat));

// Static files (uploaded media) - with detailed logging
app.use('/uploads', (req, res, next) => {
    console.log(`[Static] Serving: ${req.path}`);
    next();
}, express.static(path.join(__dirname, 'uploads'), {
    fallthrough: true,
    setHeaders: (res, filepath) => {
        console.log(`[Static] Serving file: ${filepath}`);
    }
}));

// Fallback handler for missing static files
app.use('/uploads', (req, res) => {
    console.error(`[Static] File not found: ${req.path}`);
    console.error(`[Static] Looking in: ${path.join(__dirname, 'uploads', req.path)}`);
    res.status(404).json({
        error: 'Not Found',
        path: req.path,
        fullPath: path.join(__dirname, 'uploads', req.path)
    });
});

// =============================================================================
// HEALTH CHECK
// =============================================================================

// Root health check (for Docker health check)
app.get('/health', async (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
    });
});

// API health check
app.get('/api/health', async (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
    });
});

// Database health check
app.get('/api/health/db', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({
            status: 'healthy',
            database: 'connected'
        });
    } catch (error) {
        logger.error('Database health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            database: 'disconnected',
            error: error.message
        });
    }
});

// =============================================================================
// API ROUTES
// =============================================================================

const API_PREFIX = '/api';

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/recipes`, recipeRoutes);
app.use(`${API_PREFIX}/ratings`, ratingRoutes);
app.use(`${API_PREFIX}/comments`, commentRoutes);
app.use(`${API_PREFIX}/battles`, battleRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/media`, mediaRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes); // Admin routes
app.use(`${API_PREFIX}/proofs`, proofRoutes); // Video proof routes
app.use(`${API_PREFIX}/likes`, likeRoutes); // Like/dislike routes
app.use(API_PREFIX, referenceRoutes); // Cuisines and ingredients

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Cook-Off Platform API',
        version: '1.0.0',
        documentation: '/api/docs'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        path: req.path
    });
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

app.use(errorHandler);

// =============================================================================
// SERVER START
// =============================================================================

const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
    logger.info(`🔗 API available at http://0.0.0.0:${PORT}${API_PREFIX}`);

    // Start battle status auto-updater
    startBattleStatusUpdater();
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);

    server.close(async () => {
        logger.info('HTTP server closed');

        try {
            await pool.end();
            logger.info('Database connections closed');
            process.exit(0);
        } catch (error) {
            logger.error('Error during shutdown:', error);
            process.exit(1);
        }
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = app;
