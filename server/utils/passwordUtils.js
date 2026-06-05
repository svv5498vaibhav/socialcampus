const bcrypt = require('bcryptjs');
const env = require('../config/environment');

/**
 * Hash a plain-text password
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(env.security.bcryptRounds);
  return bcrypt.hash(password, salt);
};

/**
 * Compare plain-text password with hash
 */
const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

/**
 * Validate password strength
 * Returns { valid: boolean, errors: string[] }
 */
const validatePasswordStrength = (password) => {
  const errors = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (password.length > 128) {
    errors.push('Password must not exceed 128 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Calculate strength score (0-4)
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
  if (/\d/.test(password) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++;

  const labels = ['weak', 'fair', 'good', 'strong', 'very_strong'];

  return {
    valid: errors.length === 0,
    errors,
    strength: strength,
    label: labels[strength] || 'weak',
  };
};

module.exports = {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
};
