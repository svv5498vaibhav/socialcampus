const env = require('./environment');

/**
 * Origin validation callback for Express CORS and Socket.IO
 * - Strips trailing slashes to prevent common URL mismatch bugs
 * - Allows requests from trusted origins (https://socialcampus.vercel.app, localhost, etc.)
 * - Allows non-browser requests with no origin (e.g. mobile apps, curl, server-to-server)
 * - Dynamically echoes the allowed origin for credentials support (never uses wildcard '*')
 */
const corsOriginValidator = (origin, callback) => {
  // Allow non-browser requests (mobile apps, curl, Postman, health checks)
  if (!origin) {
    return callback(null, true);
  }

  const normalizedOrigin = origin.replace(/\/+$/, '');

  if (env.allowedOrigins.includes(normalizedOrigin)) {
    return callback(null, true);
  }

  // Reject untrusted origins without throwing an uncaught exception
  return callback(null, false);
};

const corsOptions = {
  origin: corsOriginValidator,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-CSRF-Token',
    'X-XSRF-Token',
    'Accept',
    'Origin',
    'X-Requested-With',
  ],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 204,
  preflightContinue: false,
};

module.exports = {
  corsOriginValidator,
  corsOptions,
};
