const { body } = require('express-validator');

const forgotPasswordValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
];

const resetPasswordValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('otp')
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers'),
  body('newPassword')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
];

module.exports = { forgotPasswordValidation, resetPasswordValidation };
