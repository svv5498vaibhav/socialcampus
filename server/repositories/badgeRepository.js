const Badge = require('../models/Badge');
const UserBadge = require('../models/UserBadge');

class BadgeRepository {
  /**
   * Get all active badges, optionally filtered
   */
  static async getActive(filters = {}) {
    const query = { isActive: true };
    if (filters.tier) query.tier = filters.tier;
    if (filters.category) query.category = filters.category;
    if (filters.rarity) query.rarity = filters.rarity;

    return await Badge.find(query).sort({ sortOrder: 1 }).lean();
  }

  /**
   * Get a user's earned badges with full badge details
   */
  static async getUserBadges(userId) {
    return await UserBadge.find({ userId })
      .populate('badgeId')
      .sort({ unlockedAt: -1 })
      .lean();
  }

  /**
   * Grant a badge to a user (idempotent)
   */
  static async grantBadge(userId, badgeId) {
    const exists = await UserBadge.findOne({ userId, badgeId });
    if (exists) return { alreadyGranted: true, record: exists };

    const record = new UserBadge({
      userId,
      badgeId,
      unlockedAt: new Date(),
    });
    await record.save();
    return { alreadyGranted: false, record };
  }

  /**
   * Check if a user has a specific badge
   */
  static async hasBadge(userId, badgeId) {
    return !!(await UserBadge.findOne({ userId, badgeId }).lean());
  }

  /**
   * Get badge statistics for a user
   */
  static async getUserBadgeStats(userId) {
    const badges = await UserBadge.find({ userId }).populate('badgeId').lean();

    const stats = {
      total: badges.length,
      byTier: { bronze: 0, silver: 0, gold: 0, legendary: 0 },
      byCategory: { skill: 0, community: 0, achievement: 0, event: 0, special: 0 },
      byRarity: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
    };

    for (const ub of badges) {
      if (ub.badgeId) {
        const b = ub.badgeId;
        if (stats.byTier[b.tier] !== undefined) stats.byTier[b.tier]++;
        if (stats.byCategory[b.category] !== undefined) stats.byCategory[b.category]++;
        if (stats.byRarity[b.rarity] !== undefined) stats.byRarity[b.rarity]++;
      }
    }

    return stats;
  }

  /**
   * Get rarest badges across the platform
   */
  static async getRarestBadges(limit = 10) {
    const totalUsers = await require('../models/User').countDocuments({});
    if (totalUsers === 0) return [];

    return await UserBadge.aggregate([
      { $group: { _id: '$badgeId', earnedCount: { $sum: 1 } } },
      {
        $lookup: {
          from: 'badges',
          localField: '_id',
          foreignField: '_id',
          as: 'badge',
        },
      },
      { $unwind: '$badge' },
      {
        $project: {
          key: '$badge.key',
          name: '$badge.name',
          tier: '$badge.tier',
          rarity: '$badge.rarity',
          iconUrl: '$badge.iconUrl',
          color: '$badge.color',
          earnedCount: 1,
          earnedRate: { $round: [{ $multiply: [{ $divide: ['$earnedCount', totalUsers] }, 100] }, 2] },
        },
      },
      { $sort: { earnedRate: 1 } },
      { $limit: limit },
    ]);
  }
}

module.exports = BadgeRepository;
