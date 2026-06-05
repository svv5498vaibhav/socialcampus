const rateLimit = require('express-rate-limit');
const ModerationRepository = require('../repositories/moderationRepository');
const AnonymousService = require('../services/anonymousService');

/**
 * Strict Rate Limiter for Anonymous Posting
 * 10 posts/reports per 10 minutes per IP
 */
const anonymousRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many anonymous posts or reports from this connection. Please wait 10 minutes.',
  },
  keyGenerator: (req) => {
    return `anon:${req.ip || req.connection.remoteAddress}`;
  },
  handler: async (req, res, next, options) => {
    const studentHash = req.user ? AnonymousService.getStudentHash(req.user.id) : 'anonymous';
    
    // Log rate limit trigger to trust & safety logs
    await ModerationRepository.logTrustSafetyEvent({
      action: 'rate_limit_triggered',
      userIdHash: studentHash,
      metadata: { ip: req.ip, route: req.originalUrl },
      ipAddress: req.ip || req.connection.remoteAddress,
    });

    return res.status(options.statusCode).json(options.message);
  }
});

module.exports = { anonymousRateLimiter };
