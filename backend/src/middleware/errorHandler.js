const logger = require('../utils/logger');

/**
 * Global error handler
 */
const errorHandler = (err, req, res, next) => {
    // Log error
    logger.error('Error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        body: req.body,
        user: req.user?.id
    });

    // Database errors
    if (err.code) {
        switch (err.code) {
            case '23505': // Unique violation
                return res.status(409).json({
                    error: 'Conflict',
                    message: 'Resource already exists',
                    detail: err.detail
                });

            case '23503': // Foreign key violation
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Referenced resource does not exist'
                });

            case '23502': // Not null violation
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Required field is missing'
                });
        }
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Token expired'
        });
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            message: err.message
        });
    }

    // Multer errors (file upload)
    if (err.name === 'MulterError') {
        return res.status(400).json({
            error: 'Upload Error',
            message: err.message
        });
    }

    // Default error
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Internal Server Error'
        : err.message;

    res.status(statusCode).json({
        error: err.name || 'Error',
        message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
};

module.exports = errorHandler;
