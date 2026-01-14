const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
}

/**
 * Authenticate JWT token
 */
const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'No token provided'
            });
        }

        const token = authHeader.substring(7);

        const decoded = jwt.verify(token, JWT_SECRET);

        req.user = {
            id: decoded.userId,
            username: decoded.username,
            judgeLevel: decoded.judgeLevel,
            isAdmin: decoded.isAdmin || false,
            isModerator: decoded.isModerator || false
        };

        next();
    } catch (error) {
        logger.error('Authentication error:', error);

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Token expired'
            });
        }

        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid token'
        });
    }
};

/**
 * Optional authentication (doesn't fail if no token)
 */
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET);

        req.user = {
            id: decoded.userId,
            username: decoded.username,
            judgeLevel: decoded.judgeLevel,
            isAdmin: decoded.isAdmin || false,
            isModerator: decoded.isModerator || false
        };

        next();
    } catch (error) {
        // Silently ignore auth errors for optional auth
        next();
    }
};

/**
 * Generate JWT token
 */
const generateToken = (user) => {
    return jwt.sign(
        {
            userId: user.id,
            username: user.username,
            judgeLevel: user.judgeLevel || 'Beginner Taster',
            isAdmin: user.is_admin || false,
            isModerator: user.is_moderator || false
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
    );
};

module.exports = {
    authenticate,
    optionalAuth,
    generateToken
};
