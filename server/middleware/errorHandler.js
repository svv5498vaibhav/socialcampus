const { sendError } = require('../utils/responseUtils');

/**
 * Global Error Handler Middleware
 *
 * Catches all unhandled errors and returns standardized responses.
 */
const errorHandler = (err, req, res, _next) => {
  console.error('🔴 Error:', err.message || err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return sendError(res, {
      statusCode: 422,
      message: 'Validation failed',
      errors,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return sendError(res, {
      statusCode: 409,
      message: `A record with this ${field} already exists`,
      errors: [{ field, message: 'Duplicate value' }],
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, {
      statusCode: 401,
      message: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, {
      statusCode: 401,
      message: 'Token expired',
    });
  }

  // Custom error with status
  if (err.status) {
    return sendError(res, {
      statusCode: err.status,
      message: err.message,
      errors: err.errors || null,
    });
  }

  // Default 500 error
  return sendError(res, {
    statusCode: 500,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error',
  });
};

module.exports = { errorHandler };
