const AntiCheatLog = require('../models/AntiCheatLog');

class AntiCheatRepository {
  /**
   * Log a suspected violation
   */
  static async logViolation({
    userId,
    violationType,
    severity = 'low',
    evidence = {},
    relatedUserIds = [],
    relatedPostId = null,
    detectionMethod = 'middleware',
    ipAddress = null,
    deviceFingerprint = null,
  }) {
    const log = new AntiCheatLog({
      userId,
      violationType,
      severity,
      evidence,
      relatedUserIds,
      relatedPostId,
      detectionMethod,
      ipAddress,
      deviceFingerprint,
    });
    return await log.save();
  }

  /**
   * Get a user's violation history
   */
  static async getUserViolations(userId, limit = 50) {
    return await AntiCheatLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Count recent violations for a user (for escalation thresholds)
   */
  static async countRecentViolations(userId, violationType, windowHours = 24) {
    const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);
    const filter = { userId, createdAt: { $gte: since } };
    if (violationType) filter.violationType = violationType;
    return await AntiCheatLog.countDocuments(filter);
  }

  /**
   * Get all open cases for admin dashboard
   */
  static async getOpenCases(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const filter = { status: { $in: ['open', 'investigating'] } };

    const [cases, total] = await Promise.all([
      AntiCheatLog.find(filter)
        .sort({ severity: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AntiCheatLog.countDocuments(filter),
    ]);

    return { cases, total, page, limit };
  }

  /**
   * Resolve a case
   */
  static async resolveCase(logId, resolvedBy, actionTaken, pointsRevoked = 0, notes = '') {
    return await AntiCheatLog.findByIdAndUpdate(
      logId,
      {
        $set: {
          status: actionTaken === 'no_action' ? 'dismissed' : 'penalized',
          actionTaken,
          pointsRevoked,
          resolvedBy,
          resolvedAt: new Date(),
          notes,
        },
      },
      { new: true }
    );
  }

  /**
   * Detect IP collusion: multiple accounts from same IP with suspicious interactions
   */
  static async detectIPCollusion(ipAddress, windowHours = 24) {
    const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);
    return await AntiCheatLog.aggregate([
      {
        $match: {
          ipAddress,
          createdAt: { $gte: since },
          violationType: { $in: ['ip_collusion', 'fake_likes', 'sybil_attack'] },
        },
      },
      {
        $group: {
          _id: '$userId',
          violationCount: { $sum: 1 },
          latestViolation: { $max: '$createdAt' },
        },
      },
      { $sort: { violationCount: -1 } },
    ]);
  }

  /**
   * Aggregation: violation statistics for admin analytics
   */
  static async getViolationStats(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return await AntiCheatLog.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: {
            type: '$violationType',
            severity: '$severity',
          },
          count: { $sum: 1 },
          totalPointsRevoked: { $sum: '$pointsRevoked' },
        },
      },
      { $sort: { count: -1 } },
    ]);
  }
}

module.exports = AntiCheatRepository;
