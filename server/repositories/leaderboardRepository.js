const RankingHistory = require('../models/RankingHistory');
const LeaderboardSnapshot = require('../models/LeaderboardSnapshot');
const UserPoint = require('../models/UserPoint');

class LeaderboardRepository {
  /**
   * Save individual user ranking history entry
   */
  static async saveRankingEntry(userId, leaderboardType, scopeValue, data) {
    return await RankingHistory.findOneAndUpdate(
      { userId, leaderboardType, scopeValue: scopeValue || '', snapshotDate: data.snapshotDate },
      {
        currentRank: data.currentRank,
        previousRank: data.previousRank || null,
        rankChange: data.rankChange || 0,
        points: data.points,
        reputation: data.reputation || 0,
        percentile: data.percentile || 0,
        totalParticipants: data.totalParticipants || 0,
      },
      { upsert: true, new: true }
    );
  }

  /**
   * Save a leaderboard snapshot (top entries + stats)
   */
  static async saveSnapshot(leaderboardType, scopeValue, snapshotDate, topEntries, stats) {
    return await LeaderboardSnapshot.findOneAndUpdate(
      { leaderboardType, scopeValue: scopeValue || '', snapshotDate },
      {
        topEntries,
        stats,
      },
      { upsert: true, new: true }
    );
  }

  /**
   * Get a user's rank trend over time for a specific leaderboard
   */
  static async getUserRankTrend(userId, leaderboardType, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().split('T')[0];

    return await RankingHistory.find({
      userId,
      leaderboardType,
      snapshotDate: { $gte: sinceStr },
    })
      .sort({ snapshotDate: 1 })
      .lean();
  }

  /**
   * Get top movers (biggest rank improvements) for a leaderboard on a given date
   */
  static async getTopMovers(leaderboardType, snapshotDate, limit = 10) {
    return await RankingHistory.find({
      leaderboardType,
      snapshotDate,
      rankChange: { $gt: 0 },
    })
      .sort({ rankChange: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Get snapshot comparison between two dates
   */
  static async compareSnapshots(leaderboardType, scopeValue, date1, date2) {
    const [snap1, snap2] = await Promise.all([
      LeaderboardSnapshot.findOne({ leaderboardType, scopeValue: scopeValue || '', snapshotDate: date1 }).lean(),
      LeaderboardSnapshot.findOne({ leaderboardType, scopeValue: scopeValue || '', snapshotDate: date2 }).lean(),
    ]);
    return { before: snap1, after: snap2 };
  }

  /**
   * Aggregation: compute percentile for a given score in a leaderboard
   */
  static async computePercentile(scope, scopeValue, score) {
    const filter = {};
    if (scope === 'college' && scopeValue) filter.college = scopeValue;
    else if (scope === 'branch' && scopeValue) filter.branch = scopeValue;

    const total = await UserPoint.countDocuments(filter);
    if (total === 0) return 100;

    filter.lifetimePoints = { $lt: score };
    const belowCount = await UserPoint.countDocuments(filter);

    return Math.round((belowCount / total) * 100);
  }

  /**
   * Get leaderboard snapshot for analytics
   */
  static async getSnapshotHistory(leaderboardType, scopeValue, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().split('T')[0];

    return await LeaderboardSnapshot.find({
      leaderboardType,
      scopeValue: scopeValue || '',
      snapshotDate: { $gte: sinceStr },
    })
      .sort({ snapshotDate: 1 })
      .select('snapshotDate stats')
      .lean();
  }
}

module.exports = LeaderboardRepository;
