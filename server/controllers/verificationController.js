const { validationResult } = require('express-validator');
const AuthService = require('../services/authService');
const VerificationService = require('../services/verificationService');
const { sendSuccess, sendError, sendValidationError } = require('../utils/responseUtils');

class VerificationController {
  /**
   * POST /api/auth/verify-otp
   */
  static async verifyOTP(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array());
      }

      const { email, otp } = req.body;
      const result = await AuthService.verifyOTP({ email, otp });

      return sendSuccess(res, {
        message: 'Email verified successfully',
        data: result,
      });
    } catch (error) {
      if (error.status) {
        return sendError(res, { statusCode: error.status, message: error.message });
      }
      next(error);
    }
  }

  /**
   * POST /api/auth/resend-otp
   */
  static async resendOTP(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array());
      }

      const { email } = req.body;
      await AuthService.resendOTP({ email });

      return sendSuccess(res, {
        message: 'OTP sent successfully. Check your email.',
      });
    } catch (error) {
      if (error.status) {
        return sendError(res, { statusCode: error.status, message: error.message });
      }
      next(error);
    }
  }

  /**
   * GET /api/verification/status (authenticated)
   */
  static async getVerificationStatus(req, res, next) {
    try {
      const record = await VerificationService.getVerificationStatus(req.user.id);

      return sendSuccess(res, {
        message: 'Verification status retrieved',
        data: record,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = VerificationController;
