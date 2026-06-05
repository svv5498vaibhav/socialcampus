const express = require('express');
const router = express.Router();
const RecoveryController = require('../controllers/recoveryController');
const { forgotPasswordValidation, resetPasswordValidation } = require('../validators/recoveryValidators');
const { authLimiter } = require('../middleware/rateLimiter');

// POST /api/auth/forgot-password
router.post('/forgot-password', authLimiter, forgotPasswordValidation, RecoveryController.forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', authLimiter, resetPasswordValidation, RecoveryController.resetPassword);

module.exports = router;
