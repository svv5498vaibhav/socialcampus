const crypto = require('crypto');
const { cache } = require('../config/redis');
const env = require('../config/environment');

const OTP_PREFIX = 'otp:';
const OTP_ATTEMPTS_PREFIX = 'otp_attempts:';
const MAX_OTP_ATTEMPTS = 3;

/**
 * Generate a cryptographically secure OTP
 */
const generateOTP = () => {
  const length = env.otp.length;
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return String(crypto.randomInt(min, max + 1));
};

/**
 * Store OTP in Redis/memory with TTL
 */
const storeOTP = async (identifier, purpose = 'email_verification') => {
  const otp = generateOTP();
  const key = `${OTP_PREFIX}${purpose}:${identifier}`;
  const expirySeconds = env.otp.expiryMinutes * 60;

  const data = JSON.stringify({
    otp,
    purpose,
    createdAt: Date.now(),
    attempts: 0,
  });

  await cache.set(key, data, expirySeconds);

  // Reset attempt counter
  const attemptsKey = `${OTP_ATTEMPTS_PREFIX}${purpose}:${identifier}`;
  await cache.set(attemptsKey, '0', expirySeconds);

  return otp;
};

/**
 * Verify an OTP
 * Returns: { valid: boolean, error?: string }
 */
const verifyOTP = async (identifier, inputOTP, purpose = 'email_verification') => {
  const key = `${OTP_PREFIX}${purpose}:${identifier}`;
  const attemptsKey = `${OTP_ATTEMPTS_PREFIX}${purpose}:${identifier}`;

  // Check attempt count
  const attempts = parseInt(await cache.get(attemptsKey) || '0', 10);
  if (attempts >= MAX_OTP_ATTEMPTS) {
    await cache.del(key);
    await cache.del(attemptsKey);
    return { valid: false, error: 'Maximum OTP attempts exceeded. Please request a new OTP.' };
  }

  const storedData = await cache.get(key);
  if (!storedData) {
    return { valid: false, error: 'OTP has expired or does not exist. Please request a new OTP.' };
  }

  const data = JSON.parse(storedData);

  if (data.otp !== inputOTP) {
    // Increment attempt counter
    await cache.incr(attemptsKey);
    const remaining = MAX_OTP_ATTEMPTS - attempts - 1;
    return {
      valid: false,
      error: `Invalid OTP. ${remaining} attempt(s) remaining.`,
    };
  }

  // OTP is valid — delete it (one-time use)
  await cache.del(key);
  await cache.del(attemptsKey);

  return { valid: true };
};

/**
 * Check if OTP was recently sent (rate limit per identifier)
 */
const canResendOTP = async (identifier, purpose = 'email_verification') => {
  const key = `${OTP_PREFIX}${purpose}:${identifier}`;
  const storedData = await cache.get(key);

  if (!storedData) return { canResend: true };

  const data = JSON.parse(storedData);
  const elapsed = Date.now() - data.createdAt;
  const cooldown = 60 * 1000; // 60 seconds cooldown

  if (elapsed < cooldown) {
    const waitSeconds = Math.ceil((cooldown - elapsed) / 1000);
    return { canResend: false, waitSeconds };
  }

  return { canResend: true };
};

module.exports = {
  generateOTP,
  storeOTP,
  verifyOTP,
  canResendOTP,
};
