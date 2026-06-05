const Achievement = require('../models/Achievement');
const UserAchievement = require('../models/UserAchievement');

class AchievementRepository {
  /**
   * Get all active achievements, optionally filtered by category/tier
   */
  static async getActive(filters = {}) {
    const query = { isActive: true };
    if (filters.category) query.category = filters.category;
    if (filters.tier) query.tier = filters.tier;
    if (filters.milestoneType) query.milestoneType = filters.milestoneType;

    return await Achievement.find(query).sort({ sortOrder: 1 }).lean();
  }

  /**
   * Get a user's unlocked achievements with full achievement details
   */
  static async getUserAchievements(userId) {
    return await UserAchievement.find({ userId })
      .populate('achievementId')
      .sort({ unlockedAt: -1 })
      .lean();
  }

  /**
   * Check if a user has already unlocked a specific achievement
   */
  static async hasAchievement(userId, achievementId) {
    return !!(await UserAchievement.findOne({ userId, achievementId }).lean());
  }

  /**
   * Grant an achievement to a user (idempotent)
   */
  static async grantAchievement(userId, achievementId) {
    const exists = await UserAchievement.findOne({ userId, achievementId });
    if (exists) return { alreadyGranted: true, record: exists };

    const record = new UserAchievement({
      userId,
      achievementId,
      unlockedAt: new Date(),
    });
    await record.save();
    return { alreadyGranted: false, record };
  }

  /**
   * Get progress toward an achievement milestone
   */
  static async checkMilestoneProgress(userId, milestoneType, currentValue) {
    const achievements = await Achievement.find({
      milestoneType,
      isActive: true,
    }).lean();

    const unlocked = await UserAchievement.find({ userId }).select('achievementId').lean();
    const unlockedIds = new Set(unlocked.map((u) => u.achievementId.toString()));

    return achievements.map((a) => ({
      achievementId: a._id,
      key: a.key,
      name: a.name,
      tier: a.tier,
      threshold: a.milestoneThreshold,
      currentValue,
      progress: Math.min(100, Math.round((currentValue / a.milestoneThreshold) * 100)),
      isUnlocked: unlockedIds.has(a._id.toString()),
    }));
  }

  /**
   * Get aggregated achievement statistics for a user
   */
  static async getUserAchievementStats(userId) {
    const achievements = await UserAchievement.find({ userId }).populate('achievementId').lean();

    const stats = {
      total: achievements.length,
      byTier: { bronze: 0, silver: 0, gold: 0, platinum: 0, legendary: 0 },
      byCategory: { content: 0, community: 0, innovation: 0, engagement: 0, milestone: 0 },
      totalPointsFromAchievements: 0,
    };

    for (const ua of achievements) {
      if (ua.achievementId) {
        const a = ua.achievementId;
        if (stats.byTier[a.tier] !== undefined) stats.byTier[a.tier]++;
        if (stats.byCategory[a.category] !== undefined) stats.byCategory[a.category]++;
        stats.totalPointsFromAchievements += a.pointsReward || 0;
      }
    }

    return stats;
  }

  /**
   * Aggregation: achievement unlock rates (for tuning difficulty)
   */
  static async getUnlockRates() {
    const totalUsers = await require('../models/User').countDocuments({});
    if (totalUsers === 0) return [];

    return await UserAchievement.aggregate([
      { $group: { _id: '$achievementId', unlockedCount: { $sum: 1 } } },
      {
        $lookup: {
          from: 'achievements',
          localField: '_id',
          foreignField: '_id',
          as: 'achievement',
        },
      },
      { $unwind: '$achievement' },
      {
        $project: {
          key: '$achievement.key',
          name: '$achievement.name',
          tier: '$achievement.tier',
          category: '$achievement.category',
          unlockedCount: 1,
          unlockRate: { $round: [{ $multiply: [{ $divide: ['$unlockedCount', totalUsers] }, 100] }, 2] },
        },
      },
      { $sort: { unlockRate: -1 } },
    ]);
  }
}

module.exports = AchievementRepository;
