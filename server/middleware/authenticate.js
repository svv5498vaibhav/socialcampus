const { verifyAccessToken } = require('../utils/tokenUtils');
const { sendError } = require('../utils/responseUtils');
const User = require('../models/User');

/**
 * JWT Authentication Middleware
 * Extracts and verifies the access token from Authorization header
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, {
        statusCode: 401,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];
    const { valid, decoded, error } = verifyAccessToken(token);

    if (!valid) {
      return sendError(res, {
        statusCode: 401,
        message: error === 'jwt expired' ? 'Token expired. Please refresh.' : 'Invalid token.',
      });
    }

    // Attach user to request
    const user = await User.findById(decoded.userId);
    if (!user) {
      return sendError(res, {
        statusCode: 401,
        message: 'User associated with this token no longer exists.',
      });
    }

    if (user.status === 'blocked' || user.status === 'deactivated') {
      return sendError(res, {
        statusCode: 403,
        message: 'Your account has been restricted. Contact support.',
      });
    }

    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    next();
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      message: 'Authentication error',
    });
  }
};

/**
 * Optional authentication — attaches user if token present, but doesn't block
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  const { valid, decoded } = verifyAccessToken(token);

  if (valid) {
    const user = await User.findById(decoded.userId);
    if (user) {
      req.user = {
        id: user._id,
        email: user.email,
        role: user.role,
        status: user.status,
      };
    }
  }

  next();
};

module.exports = { authenticate, optionalAuth };
