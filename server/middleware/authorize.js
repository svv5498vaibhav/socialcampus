const { sendError } = require('../utils/responseUtils');

/**
 * Role-Based Access Control Middleware
 * Usage: authorize('admin', 'moderator')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, {
        statusCode: 401,
        message: 'Authentication required',
      });
    }

    if (!roles.includes(req.user.role)) {
      return sendError(res, {
        statusCode: 403,
        message: 'Insufficient permissions. This action requires elevated access.',
      });
    }

    next();
  };
};

module.exports = { authorize };
