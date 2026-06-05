const { body } = require('express-validator');

const registerValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required (max 50 characters)'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required (max 50 characters)'),
  body('rollNumber')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Roll number must be between 3 and 30 characters'),
  body('college')
    .trim()
    .notEmpty()
    .withMessage('College name is required'),
  body('branch')
    .trim()
    .notEmpty()
    .withMessage('Branch is required'),
  body('semester')
    .trim()
    .notEmpty()
    .withMessage('Semester is required')
    .isInt({ min: 1, max: 12 })
    .withMessage('Semester must be between 1 and 12'),
];

const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  body('rememberMe')
    .optional()
    .isBoolean()
    .withMessage('rememberMe must be a boolean'),
];

module.exports = { registerValidation, loginValidation };
