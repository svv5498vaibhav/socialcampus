const mongoSanitize = require('mongo-sanitize');

/**
 * Input Sanitization Middleware
 *
 * Protects against:
 * - NoSQL injection (mongo-sanitize)
 * - XSS attacks (HTML entity encoding)
 * - Prototype pollution
 */
const inputSanitizer = (req, res, next) => {
  // Sanitize body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query params
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize URL params
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

/**
 * Deep sanitize an object
 */
function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return typeof obj === 'string' ? sanitizeString(obj) : obj;
  }

  // Prevent prototype pollution
  if ('__proto__' in obj) delete obj.__proto__;
  if ('constructor' in obj && typeof obj.constructor !== 'function') delete obj.constructor;
  if ('prototype' in obj) delete obj.prototype;

  // MongoDB operator injection prevention
  const sanitized = mongoSanitize(obj);

  // Recursively sanitize string values
  for (const key of Object.keys(sanitized)) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeString(sanitized[key]);
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key]);
    }
  }

  return sanitized;
}

/**
 * Sanitize a string value
 */
function sanitizeString(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

module.exports = { inputSanitizer };
