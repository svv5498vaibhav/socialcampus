const { validationResult } = require('express-validator');
const AuthService = require('../services/authService');
const { sendSuccess, sendError, sendValidationError } = require('../utils/responseUtils');

class RecoveryController {
  /**
   * POST /api/auth/forgot-password
   */
  static async forgotPassword(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array());
      }

      await AuthService.forgotPassword({
        email: req.body.email,
        ipAddress: req.deviceInfo.ipAddress,
      });

      // Always return success to prevent email enumeration
      return sendSuccess(res, {
        message: 'If an account exists with this email, a password reset OTP has been sent.',
      });
    } catch (error) {
      if (error.status) {
        return sendError(res, { statusCode: error.status, message: error.message });
      }
      next(error);
    }
  }

  /**
   * POST /api/auth/reset-password
   */
  static async resetPassword(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array());
      }

      const { email, otp, newPassword } = req.body;
      await AuthService.resetPassword({
        email,
        otp,
        newPassword,
        ipAddress: req.deviceInfo.ipAddress,
        userAgent: req.deviceInfo.userAgent,
      });

      return sendSuccess(res, {
        message: 'Password reset successful. Please login with your new password.',
      });
    } catch (error) {
      if (error.status) {
        return sendError(res, { statusCode: error.status, message: error.message });
      }
      next(error);
    }
  }
}

module.exports = RecoveryController;
