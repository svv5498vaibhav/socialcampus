/**
 * Device Tracking Middleware
 *
 * Extracts device information from request headers
 * and attaches it to req.deviceInfo
 */
const deviceTracker = (req, res, next) => {
  req.deviceInfo = {
    ipAddress: req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || '0.0.0.0',
    userAgent: req.headers['user-agent'] || 'Unknown',
  };

  next();
};

module.exports = { deviceTracker };
