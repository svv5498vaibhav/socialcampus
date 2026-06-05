const Session = require('../models/Session');
const Device = require('../models/Device');
const { v4: uuidv4 } = require('uuid');
const env = require('../config/environment');

/**
 * Session Management Service
 *
 * Handles multi-device sessions, device tracking,
 * session limits, and bulk logout.
 */
class SessionService {
  /**
   * Create a new session
   */
  static async createSession({ userId, refreshToken, ipAddress, userAgent, rememberMe = false }) {
    const deviceId = this._generateDeviceId(userAgent, ipAddress);
    const expiryDuration = rememberMe ? env.jwt.refreshExpiryRemember : env.jwt.refreshExpiry;
    const expiresAt = this._parseExpiry(expiryDuration);

    // Enforce session limit — remove oldest if exceeded
    const activeSessions = await Session.countDocuments({ userId, isActive: true });
    if (activeSessions >= env.security.maxSessionsPerUser) {
      const oldest = await Session.findOne({ userId, isActive: true }).sort({ createdAt: 1 });
      if (oldest) {
        oldest.isActive = false;
        await oldest.save();
      }
    }

    // Check if device already has a session — replace it
    const existingSession = await Session.findOne({ userId, deviceId, isActive: true });
    if (existingSession) {
      existingSession.isActive = false;
      await existingSession.save();
    }

    const session = await Session.create({
      userId,
      refreshToken,
      deviceId,
      ipAddress,
      userAgent,
      isActive: true,
      rememberMe,
      expiresAt,
    });

    // Track device
    await this._trackDevice({ userId, deviceId, ipAddress, userAgent });

    return session;
  }

  /**
   * Find active session by refresh token
   */
  static async findByRefreshToken(refreshToken) {
    return Session.findOne({
      refreshToken,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });
  }

  /**
   * Rotate refresh token (invalidate old, create new session)
   */
  static async rotateSession(oldRefreshToken, newRefreshToken) {
    const session = await Session.findOne({ refreshToken: oldRefreshToken }).select('+refreshToken');
    if (!session) return null;

    session.refreshToken = newRefreshToken;
    session.lastAccessedAt = new Date();
    await session.save();

    return session;
  }

  /**
   * Deactivate a specific session
   */
  static async deactivateSession(sessionId, userId) {
    return Session.findOneAndUpdate(
      { _id: sessionId, userId },
      { isActive: false },
      { new: true }
    );
  }

  /**
   * Deactivate all sessions for a user (logout all devices)
   */
  static async deactivateAllSessions(userId, exceptSessionId = null) {
    const filter = { userId, isActive: true };
    if (exceptSessionId) {
      filter._id = { $ne: exceptSessionId };
    }

    const result = await Session.updateMany(filter, { isActive: false });
    return result.modifiedCount;
  }

  /**
   * Get active sessions for a user
   */
  static async getActiveSessions(userId) {
    const sessions = await Session.find({ userId, isActive: true })
      .select('-refreshToken')
      .sort({ lastAccessedAt: -1 })
      .lean();

    // Enrich with device info
    const enriched = await Promise.all(
      sessions.map(async (session) => {
        const device = await Device.findOne({
          userId,
          deviceFingerprint: session.deviceId,
        }).lean();

        return {
          ...session,
          device: device
            ? {
                name: device.deviceName,
                browser: device.browser,
                os: device.os,
                trusted: device.trusted,
              }
            : null,
        };
      })
    );

    return enriched;
  }

  /**
   * Track device information
   */
  static async _trackDevice({ userId, deviceId, ipAddress, userAgent }) {
    const parsed = this._parseUserAgent(userAgent);

    await Device.findOneAndUpdate(
      { userId, deviceFingerprint: deviceId },
      {
        userId,
        deviceFingerprint: deviceId,
        deviceName: `${parsed.browser} on ${parsed.os}`,
        browser: parsed.browser,
        os: parsed.os,
        ipAddress,
        lastSeen: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  /**
   * Generate a device ID from user agent + IP
   */
  static _generateDeviceId(userAgent, ipAddress) {
    const crypto = require('crypto');
    return crypto
      .createHash('sha256')
      .update(`${userAgent}::${ipAddress}`)
      .digest('hex')
      .substring(0, 32);
  }

  /**
   * Parse user agent string into browser/OS
   */
  static _parseUserAgent(ua) {
    const result = { browser: 'Unknown', os: 'Unknown' };

    // Browser detection
    if (ua.includes('Firefox/')) result.browser = 'Firefox';
    else if (ua.includes('Edg/')) result.browser = 'Edge';
    else if (ua.includes('Chrome/')) result.browser = 'Chrome';
    else if (ua.includes('Safari/') && !ua.includes('Chrome')) result.browser = 'Safari';
    else if (ua.includes('Opera') || ua.includes('OPR/')) result.browser = 'Opera';

    // OS detection
    if (ua.includes('Windows NT 10')) result.os = 'Windows 10/11';
    else if (ua.includes('Windows')) result.os = 'Windows';
    else if (ua.includes('Mac OS X')) result.os = 'macOS';
    else if (ua.includes('Linux')) result.os = 'Linux';
    else if (ua.includes('Android')) result.os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) result.os = 'iOS';

    return result;
  }

  /**
   * Parse JWT duration string to Date
   */
  static _parseExpiry(duration) {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };

    return new Date(Date.now() + value * multipliers[unit]);
  }
}

module.exports = SessionService;
