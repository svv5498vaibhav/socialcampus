const express = require('express');
const router = express.Router();
const VerificationController = require('../controllers/verificationController');
const { verifyOTPValidation, resendOTPValidation } = require('../validators/verificationValidators');
const { authenticate } = require('../middleware/authenticate');
const { otpLimiter } = require('../middleware/rateLimiter');

// POST /api/auth/verify-otp
router.post('/verify-otp', otpLimiter, verifyOTPValidation, VerificationController.verifyOTP);

// POST /api/auth/resend-otp
router.post('/resend-otp', otpLimiter, resendOTPValidation, VerificationController.resendOTP);

// GET /api/verification/status (requires auth)
router.get('/status', authenticate, VerificationController.getVerificationStatus);

module.exports = router;
