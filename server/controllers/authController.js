const { validationResult } = require('express-validator');
const AuthService = require('../services/authService');
const { sendSuccess, sendError, sendValidationError } = require('../utils/responseUtils');
const { COOKIES } = require('../utils/constants');
const env = require('../config/environment');

class AuthController {
  /**
   * POST /api/auth/register
   */
  static async register(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array());
      }

      const result = await AuthService.register({
        ...req.body,
        ipAddress: req.deviceInfo.ipAddress,
        userAgent: req.deviceInfo.userAgent,
      });

      return sendSuccess(res, {
        statusCode: 201,
        message: 'Registration successful. Please verify your email with the OTP sent.',
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
   * POST /api/auth/login
   */
  static async login(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array());
      }

      const { email, password, rememberMe } = req.body;

      const result = await AuthService.login({
        email,
        password,
        rememberMe,
        ipAddress: req.deviceInfo.ipAddress,
        userAgent: req.deviceInfo.userAgent,
      });

      // Set refresh token in httpOnly cookie
      const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
      res.cookie(COOKIES.REFRESH_TOKEN, result.refreshToken, {
        httpOnly: true,
        secure: env.isProd,
        sameSite: env.isProd ? 'none' : 'lax',
        maxAge,
        path: '/api/auth',
      });

      return sendSuccess(res, {
        message: 'Login successful',
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      if (error.status) {
        return sendError(res, { statusCode: error.status, message: error.message });
      }
      next(error);
    }
  }

  /**
   * POST /api/auth/refresh-token
   */
  static async refreshToken(req, res, next) {
    try {
      const refreshToken = req.cookies?.[COOKIES.REFRESH_TOKEN] || req.body.refreshToken;

      if (!refreshToken) {
        return sendError(res, { statusCode: 401, message: 'No refresh token provided' });
      }

      const result = await AuthService.refreshToken({
        refreshToken,
        ipAddress: req.deviceInfo.ipAddress,
        userAgent: req.deviceInfo.userAgent,
      });

      // Update cookie with new refresh token
      res.cookie(COOKIES.REFRESH_TOKEN, result.refreshToken, {
        httpOnly: true,
        secure: env.isProd,
        sameSite: env.isProd ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/auth',
      });

      return sendSuccess(res, {
        message: 'Token refreshed',
        data: { accessToken: result.accessToken },
      });
    } catch (error) {
      if (error.status) {
        return sendError(res, { statusCode: error.status, message: error.message });
      }
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   */
  static async logout(req, res, next) {
    try {
      const refreshToken = req.cookies?.[COOKIES.REFRESH_TOKEN];

      await AuthService.logout({
        refreshToken,
        userId: req.user.id,
        ipAddress: req.deviceInfo.ipAddress,
        userAgent: req.deviceInfo.userAgent,
      });

      res.clearCookie(COOKIES.REFRESH_TOKEN, {
        path: '/api/auth',
        secure: env.isProd,
        sameSite: env.isProd ? 'none' : 'lax',
      });

      return sendSuccess(res, { message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout-all
   */
  static async logoutAll(req, res, next) {
    try {
      const result = await AuthService.logoutAll({
        userId: req.user.id,
        ipAddress: req.deviceInfo.ipAddress,
        userAgent: req.deviceInfo.userAgent,
      });

      res.clearCookie(COOKIES.REFRESH_TOKEN, { path: '/api/auth' });

      return sendSuccess(res, {
        message: `Logged out from all devices. ${result.sessionsTerminated} sessions terminated.`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
