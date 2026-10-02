const crypto = require('crypto');
const env = require('../config/environment');
const { sendError } = require('../utils/responseUtils');
const { COOKIES } = require('../utils/constants');

/**
 * CSRF Protection Middleware
 *
 * Generates CSRF tokens and validates them on state-changing requests.
 * Uses double-submit cookie pattern.
 */
const generateCSRFToken = (req, res, next) => {
  // Generate token on GET requests to auth pages
  const token = crypto.randomBytes(32).toString('hex');

  res.cookie(COOKIES.CSRF_TOKEN, token, {
    httpOnly: false, // Needs to be readable by JS for header inclusion
    secure: env.isProd,
    sameSite: env.isProd ? 'none' : 'lax',
    maxAge: 60 * 60 * 1000, // 1 hour
  });

  req.csrfToken = token;
  next();
};

const validateCSRFToken = (req, res, next) => {
  // Skip in development for API testing convenience
  if (env.isDev) return next();

  const cookieToken = req.cookies?.[COOKIES.CSRF_TOKEN];
  const headerToken = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];

  if (!cookieToken || !headerToken) {
    return sendError(res, {
      statusCode: 403,
      message: 'CSRF token missing',
    });
  }

  if (cookieToken !== headerToken) {
    return sendError(res, {
      statusCode: 403,
      message: 'CSRF token mismatch',
    });
  }

  next();
};

module.exports = { generateCSRFToken, validateCSRFToken };
