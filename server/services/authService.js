const User = require('../models/User');
const { hashPassword, comparePassword } = require('../utils/passwordUtils');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/tokenUtils');
const SessionService = require('./sessionService');
const FraudDetectionEngine = require('./fraudDetectionService');
const VerificationService = require('./verificationService');
const TrustScoreEngine = require('./trustScoreService');
const otpService = require('./otpService');
const emailService = require('./emailService');
const auditService = require('./auditService');
const { cache } = require('../config/redis');
const env = require('../config/environment');
const {
  USER_STATUS,
  LOGIN_ACTIONS,
  SECURITY_EVENTS,
  SEVERITY,
  COOKIES,
} = require('../utils/constants');

class AuthService {
  /**
   * Register a new student
   */
  static async register({ email, password, firstName, lastName, rollNumber, college, branch, semester, ipAddress, userAgent }) {
    // 1. Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw { status: 409, message: 'An account with this email already exists' };
    }

    // 2. Check duplicate roll number
    if (rollNumber) {
      const existingRoll = await User.findOne({ rollNumber: rollNumber.toUpperCase() });
      if (existingRoll) {
        await auditService.logSecurityEvent({
          eventType: SECURITY_EVENTS.DUPLICATE_ACCOUNT,
          severity: SEVERITY.HIGH,
          description: `Duplicate roll number registration attempt: ${rollNumber}`,
          metadata: { rollNumber, email },
          ipAddress,
        });
        throw { status: 409, message: 'An account with this roll number already exists' };
      }
    }

    // 3. Run fraud detection
    const fraudAnalysis = await FraudDetectionEngine.analyzeRegistration({
      email,
      rollNumber,
      ipAddress,
      college,
    });

    if (fraudAnalysis.shouldBlock) {
      throw {
        status: 403,
        message: 'Registration blocked due to security concerns. Please contact support.',
      };
    }

    // 4. Hash password and create user
    const passwordHash = await hashPassword(password);

    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      rollNumber: rollNumber ? rollNumber.toUpperCase() : undefined,
      college,
      branch,
      semester,
      status: USER_STATUS.PENDING,
      registrationIp: ipAddress,
      riskLevel: fraudAnalysis.isSuspicious ? 'high' : 'medium',
    });

    // 5. Generate and send OTP
    const otp = await otpService.storeOTP(user.email, 'email_verification');
    await emailService.sendOTPEmail(user.email, otp, 'Email Verification');

    // 6. Log registration
    await auditService.logLoginEvent({
      userId: user._id,
      email: user.email,
      action: LOGIN_ACTIONS.REGISTER,
      ipAddress,
      userAgent,
      status: 'success',
    });

    // 7. Initialize verification record
    await VerificationService.runAutoVerification(user._id);

    return {
      user: user.toProfile(),
      requiresOTP: true,
      fraudAnalysis: {
        isSuspicious: fraudAnalysis.isSuspicious,
        riskScore: fraudAnalysis.riskScore,
      },
    };
  }

  /**
   * Verify email OTP
   */
  static async verifyOTP({ email, otp }) {
    const result = await otpService.verifyOTP(email, otp, 'email_verification');

    if (!result.valid) {
      throw { status: 400, message: result.error };
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw { status: 404, message: 'User not found' };
    }

    // Mark email as verified and run auto-verification
    await VerificationService.markEmailVerified(user._id);

    // Update user status
    user.emailVerified = true;
    user.status = USER_STATUS.ACTIVE;
    await user.save();

    return { verified: true, user: user.toProfile() };
  }

  /**
   * Resend OTP
   */
  static async resendOTP({ email }) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw { status: 404, message: 'No account found with this email' };
    }

    if (user.emailVerified) {
      throw { status: 400, message: 'Email is already verified' };
    }

    const canResend = await otpService.canResendOTP(email, 'email_verification');
    if (!canResend.canResend) {
      throw {
        status: 429,
        message: `Please wait ${canResend.waitSeconds} seconds before requesting a new OTP`,
      };
    }

    const otp = await otpService.storeOTP(email, 'email_verification');
    await emailService.sendOTPEmail(email, otp, 'Email Verification');

    return { sent: true };
  }

  /**
   * Login a user
   */
  static async login({ email, password, rememberMe = false, ipAddress, userAgent }) {
    // 1. Find user
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      await auditService.logLoginEvent({
        email,
        action: LOGIN_ACTIONS.LOGIN_FAILED,
        ipAddress,
        userAgent,
        status: 'failure',
        failureReason: 'Account not found',
      });
      throw { status: 401, message: 'Invalid email or password' };
    }

    // 2. Check if account is locked
    if (user.isLocked()) {
      const lockRemaining = Math.ceil((user.lockedUntil - Date.now()) / 60000);
      throw {
        status: 423,
        message: `Account is locked. Try again in ${lockRemaining} minutes.`,
      };
    }

    // 3. Check account status
    if (user.status === USER_STATUS.BLOCKED) {
      throw { status: 403, message: 'Your account has been blocked. Contact support.' };
    }
    if (user.status === USER_STATUS.SUSPENDED) {
      throw { status: 403, message: 'Your account is suspended. Contact support.' };
    }

    // 4. Verify password
    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      user.failedLoginAttempts += 1;

      // Lock account after max attempts
      if (user.failedLoginAttempts >= env.security.maxLoginAttempts) {
        user.lockedUntil = new Date(Date.now() + env.security.lockTimeMinutes * 60 * 1000);

        await auditService.logLoginEvent({
          userId: user._id,
          email: user.email,
          action: LOGIN_ACTIONS.ACCOUNT_LOCKED,
          ipAddress,
          userAgent,
          status: 'warning',
          failureReason: `Locked after ${user.failedLoginAttempts} failed attempts`,
        });

        await auditService.logSecurityEvent({
          userId: user._id,
          eventType: SECURITY_EVENTS.BRUTE_FORCE,
          severity: SEVERITY.HIGH,
          description: `Account locked after ${user.failedLoginAttempts} failed login attempts`,
          metadata: { attempts: user.failedLoginAttempts },
          ipAddress,
        });
      }

      await user.save();

      await auditService.logLoginEvent({
        userId: user._id,
        email: user.email,
        action: LOGIN_ACTIONS.LOGIN_FAILED,
        ipAddress,
        userAgent,
        status: 'failure',
        failureReason: 'Invalid password',
      });

      throw { status: 401, message: 'Invalid email or password' };
    }

    // 5. Reset failed attempts on success
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    user.lastLoginAt = new Date();
    user.lastLoginIp = ipAddress;
    await user.save();

    // 6. Run fraud analysis on login
    const LoginLog = require('../models/LoginLog');
    const previousLogs = await LoginLog.find({ userId: user._id, action: 'login_success' })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();
    const previousIps = [...new Set(previousLogs.map((l) => l.ipAddress))];

    await FraudDetectionEngine.analyzeLogin({
      userId: user._id,
      ipAddress,
      userAgent,
      previousIps,
    });

    // 7. Generate tokens
    const tokenPayload = {
      userId: user._id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload, rememberMe);

    // 8. Create session
    await SessionService.createSession({
      userId: user._id,
      refreshToken,
      ipAddress,
      userAgent,
      rememberMe,
    });

    // 9. Log success
    await auditService.logLoginEvent({
      userId: user._id,
      email: user.email,
      action: LOGIN_ACTIONS.LOGIN_SUCCESS,
      ipAddress,
      userAgent,
      status: 'success',
    });

    return {
      user: user.toProfile(),
      accessToken,
      refreshToken,
      rememberMe,
    };
  }

  /**
   * Refresh access token
   */
  static async refreshToken({ refreshToken, ipAddress, userAgent }) {
    // 1. Verify token
    const { valid, decoded, error } = verifyRefreshToken(refreshToken);
    if (!valid) {
      throw { status: 401, message: 'Invalid or expired refresh token' };
    }

    // 2. Find session
    const session = await SessionService.findByRefreshToken(refreshToken);
    if (!session) {
      // Possible token reuse attack — invalidate all sessions
      await auditService.logSecurityEvent({
        userId: decoded.userId,
        eventType: SECURITY_EVENTS.SESSION_HIJACK,
        severity: SEVERITY.CRITICAL,
        description: 'Refresh token reuse detected — possible session hijacking',
        metadata: { ipAddress },
        ipAddress,
      });

      await SessionService.deactivateAllSessions(decoded.userId);
      throw { status: 401, message: 'Session invalidated. Please login again.' };
    }

    // 3. Generate new tokens
    const user = await User.findById(decoded.userId);
    if (!user || user.status === 'blocked') {
      throw { status: 403, message: 'Account is not accessible' };
    }

    const tokenPayload = {
      userId: user._id,
      email: user.email,
      role: user.role,
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload, session.rememberMe);

    // 4. Rotate refresh token
    await SessionService.rotateSession(refreshToken, newRefreshToken);

    await auditService.logLoginEvent({
      userId: user._id,
      action: LOGIN_ACTIONS.TOKEN_REFRESH,
      ipAddress,
      userAgent,
      status: 'success',
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Logout current session
   */
  static async logout({ refreshToken, userId, ipAddress, userAgent }) {
    if (refreshToken) {
      const session = await SessionService.findByRefreshToken(refreshToken);
      if (session) {
        session.isActive = false;
        await session.save();
      }
    }

    await auditService.logLoginEvent({
      userId,
      action: LOGIN_ACTIONS.LOGOUT,
      ipAddress,
      userAgent,
      status: 'success',
    });

    return { loggedOut: true };
  }

  /**
   * Logout from all devices
   */
  static async logoutAll({ userId, ipAddress, userAgent }) {
    const count = await SessionService.deactivateAllSessions(userId);

    await auditService.logLoginEvent({
      userId,
      action: LOGIN_ACTIONS.LOGOUT_ALL,
      ipAddress,
      userAgent,
      status: 'success',
    });

    return { loggedOut: true, sessionsTerminated: count };
  }

  /**
   * Forgot password — send reset OTP
   */
  static async forgotPassword({ email, ipAddress }) {
    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success to prevent email enumeration
    if (!user) {
      return { sent: true };
    }

    const canResend = await otpService.canResendOTP(email, 'password_reset');
    if (!canResend.canResend) {
      throw {
        status: 429,
        message: `Please wait ${canResend.waitSeconds} seconds before requesting again`,
      };
    }

    const otp = await otpService.storeOTP(email, 'password_reset');
    await emailService.sendOTPEmail(email, otp, 'Password Reset');

    return { sent: true };
  }

  /**
   * Reset password with OTP
   */
  static async resetPassword({ email, otp, newPassword, ipAddress, userAgent }) {
    // Verify OTP
    const result = await otpService.verifyOTP(email, otp, 'password_reset');
    if (!result.valid) {
      throw { status: 400, message: result.error };
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw { status: 404, message: 'User not found' };
    }

    // Hash new password
    user.passwordHash = await hashPassword(newPassword);
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    await user.save();

    // Invalidate all sessions
    await SessionService.deactivateAllSessions(user._id);

    await auditService.logLoginEvent({
      userId: user._id,
      email: user.email,
      action: LOGIN_ACTIONS.PASSWORD_RESET,
      ipAddress,
      userAgent,
      status: 'success',
    });

    return { reset: true };
  }
}

module.exports = AuthService;
