const AntiCheatRepository = require('../repositories/antiCheatRepository');
const UserPoint = require('../models/UserPoint');

class AntiCheatService {
  /**
   * Log and evaluate a suspicious activity
   * Auto-escalates severity based on recurrence
   */
  static async flagSuspiciousActivity({
    userId,
    violationType,
    evidence = {},
    relatedUserIds = [],
    relatedPostId = null,
    ipAddress = null,
    deviceFingerprint = null,
    detectionMethod = 'middleware',
  }) {
    // Check recurrence to auto-escalate severity
    const recentCount = await AntiCheatRepository.countRecentViolations(userId, violationType, 24);

    let severity = 'low';
    if (recentCount >= 10) severity = 'critical';
    else if (recentCount >= 5) severity = 'high';
    else if (recentCount >= 2) severity = 'medium';

    const log = await AntiCheatRepository.logViolation({
      userId,
      violationType,
      severity,
      evidence: { ...evidence, recentViolationCount: recentCount + 1 },
      relatedUserIds,
      relatedPostId,
      detectionMethod,
      ipAddress,
      deviceFingerprint,
    });

    // Auto-penalize for critical violations
    if (severity === 'critical') {
      await AntiCheatService._autoPenalize(userId, violationType, log._id);
    }

    return { log, severity, autoEscalated: severity !== 'low' };
  }

  /**
   * Auto-penalize for critical violations: revoke points
   */
  static async _autoPenalize(userId, violationType, logId) {
    const penaltyMap = {
      fake_likes: 100,
      point_farming: 200,
      spam_engagement: 50,
      bot_behavior: 500,
      sybil_attack: 1000,
    };

    const pointsToRevoke = penaltyMap[violationType] || 50;

    try {
      const userPoint = await UserPoint.findOne({ userId });
      if (userPoint) {
        userPoint.currentPoints = Math.max(0, userPoint.currentPoints - pointsToRevoke);
        await userPoint.save();
      }

      await AntiCheatRepository.resolveCase(
        logId,
        null, // system auto-resolution
        'points_revoked',
        pointsToRevoke,
        `Auto-penalized: ${pointsToRevoke} points revoked for ${violationType} (critical severity)`
      );

      console.warn(`⚠️ AntiCheat: Auto-penalized user ${userId}: -${pointsToRevoke} points for ${violationType}`);
    } catch (err) {
      console.error(`AntiCheat auto-penalty failed for user ${userId}:`, err.message);
    }
  }

  /**
   * Run periodic batch scan for suspicious patterns
   * Called by cron job
   */
  static async runBatchScan() {
    console.log('🔍 AntiCheat: Starting batch scan for suspicious patterns...');
    const startTime = Date.now();

    try {
      // Detect velocity anomalies: users with > 200 point-earning actions in last 24h
      const Activity = require('../models/Activity');
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const suspiciousVelocity = await Activity.aggregate([
        { $match: { createdAt: { $gte: since }, pointsImpact: { $gt: 0 } } },
        { $group: { _id: '$userId', actionCount: { $sum: 1 }, totalPoints: { $sum: '$pointsImpact' } } },
        { $match: { actionCount: { $gt: 200 } } },
      ]);

      for (const suspect of suspiciousVelocity) {
        await AntiCheatService.flagSuspiciousActivity({
          userId: suspect._id,
          violationType: 'velocity_exceeded',
          evidence: { actionCount: suspect.actionCount, totalPoints: suspect.totalPoints, windowHours: 24 },
          detectionMethod: 'cron_scan',
        });
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ AntiCheat: Batch scan completed in ${duration}s. Flagged ${suspiciousVelocity.length} velocity anomalies.`);
    } catch (err) {
      console.error('❌ AntiCheat: Batch scan failed:', err.message);
    }
  }

  /**
   * Get admin dashboard summary
   */
  static async getDashboardSummary() {
    const [openCases, violationStats] = await Promise.all([
      AntiCheatRepository.getOpenCases(1, 10),
      AntiCheatRepository.getViolationStats(30),
    ]);

    return {
      openCases: openCases.cases,
      totalOpenCases: openCases.total,
      violationStats,
    };
  }
}

module.exports = AntiCheatService;
