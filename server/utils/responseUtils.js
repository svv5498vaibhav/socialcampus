const { v4: uuidv4 } = require('uuid');

/**
 * Standardized success response
 */
const sendSuccess = (res, { statusCode = 200, message = 'Success', data = null } = {}) => {
  const response = {
    success: true,
    statusCode,
    message,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: uuidv4(),
    },
  };
  return res.status(statusCode).json(response);
};

/**
 * Standardized error response
 */
const sendError = (res, { statusCode = 500, message = 'Internal Server Error', errors = null } = {}) => {
  const response = {
    success: false,
    statusCode,
    message,
    errors,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: uuidv4(),
    },
  };
  return res.status(statusCode).json(response);
};

/**
 * Standardized validation error response
 */
const sendValidationError = (res, errors) => {
  return sendError(res, {
    statusCode: 422,
    message: 'Validation failed',
    errors: errors.map((err) => ({
      field: err.path || err.param,
      message: err.msg || err.message,
    })),
  });
};

module.exports = {
  sendSuccess,
  sendError,
  sendValidationError,
};
