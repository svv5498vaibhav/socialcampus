const rateLimit = require('express-rate-limit');
const env = require('../config/environment');

/**
 * General rate limiter — 100 requests per 15 minutes
 */
const generalLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many requests. Please try again later.',
  },
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  },
});

/**
 * Auth rate limiter — strict limit for login/register/OTP
 * 5 attempts per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
  keyGenerator: (req) => {
    return `auth:${req.ip || req.connection.remoteAddress}`;
  },
  skipSuccessfulRequests: false,
});

/**
 * OTP rate limiter — 3 OTP requests per 10 minutes
 */
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many OTP requests. Please try again later.',
  },
  keyGenerator: (req) => {
    return `otp:${req.ip}:${req.body?.email || ''}`;
  },
});

module.exports = { generalLimiter, authLimiter, otpLimiter };
