const jwt = require('jsonwebtoken');
const env = require('../config/environment');

/**
 * Generate a JWT access token (short-lived)
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiry,
    issuer: 'campusx-guardian-ai',
    audience: 'campusx-client',
  });
};

/**
 * Generate a JWT refresh token (long-lived)
 */
const generateRefreshToken = (payload, rememberMe = false) => {
  const expiry = rememberMe ? env.jwt.refreshExpiryRemember : env.jwt.refreshExpiry;
  return jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: expiry,
    issuer: 'campusx-guardian-ai',
    audience: 'campusx-client',
  });
};

/**
 * Verify a JWT access token
 */
const verifyAccessToken = (token) => {
  try {
    return { valid: true, decoded: jwt.verify(token, env.jwt.accessSecret) };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

/**
 * Verify a JWT refresh token
 */
const verifyRefreshToken = (token) => {
  try {
    return { valid: true, decoded: jwt.verify(token, env.jwt.refreshSecret) };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

/**
 * Calculate expiry date from JWT duration string
 */
const getExpiryDate = (duration) => {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // default 7d

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return new Date(Date.now() + value * multipliers[unit]);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  getExpiryDate,
};
