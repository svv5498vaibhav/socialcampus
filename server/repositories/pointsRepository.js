const UserPoint = require('../models/UserPoint');
const PointsLog = require('../models/PointsLog');
const User = require('../models/User');

class PointsRepository {
  /**
   * Find or create a UserPoint record, syncing denormalized user context
   */
  static async findOrCreate(userId) {
    let record = await UserPoint.findOne({ userId });
    if (!record) {
      const user = await User.findById(userId).select('college branch semester').lean();
      record = new UserPoint({
        userId,
        college: user?.college || '',
        branch: user?.branch || '',
        semester: user?.semester || '',
      });
      await record.save();
    }
    return record;
  }

  /**
   * Atomic increment with daily cap enforcement
   * Returns { success, pointsAwarded, record }
   */
  static async atomicIncrement(userId, points, categoryField = null) {
    const update = {
      $inc: {
        currentPoints: points,
        lifetimePoints: points,
        weeklyPoints: points,
        monthlyPoints: points,
      },
    };

    if (categoryField) {
      update.$inc[`categoryPoints.${categoryField}`] = points;
    }

    const record = await UserPoint.findOneAndUpdate(
      { userId },
      update,
      { new: true, upsert: false }
    );

    return record;
  }

  /**
   * Batch reset weekly points for all users (called by weekly cron)
   */
  static async resetWeeklyPoints(newWeekKey) {
    return await UserPoint.updateMany(
      { weekKey: { $ne: newWeekKey } },
      { $set: { weeklyPoints: 0, weekKey: newWeekKey } }
    );
  }

  /**
   * Batch reset monthly points for all users (called by monthly cron)
   */
  static async resetMonthlyPoints(newMonthKey) {
    return await UserPoint.updateMany(
      { monthKey: { $ne: newMonthKey } },
      { $set: { monthlyPoints: 0, monthKey: newMonthKey } }
    );
  }

  /**
   * Update streak tracking
   */
  static async updateStreak(userId, todayStr) {
    const record = await UserPoint.findOne({ userId });
    if (!record) return null;

    const lastDate = record.streak.lastActiveDate;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastDate === todayStr) {
      // Already active today, no change
      return record;
    } else if (lastDate === yesterdayStr) {
      // Consecutive day — extend streak
      record.streak.currentStreak += 1;
      if (record.streak.currentStreak > record.streak.longestStreak) {
        record.streak.longestStreak = record.streak.currentStreak;
      }
    } else {
      // Streak broken — reset
      record.streak.currentStreak = 1;
    }

    record.streak.lastActiveDate = todayStr;
    await record.save();
    return record;
  }

  /**
   * Scoped leaderboard query (MongoDB fallback when Redis is down)
   */
  static async getLeaderboardPage(scope, scopeValue, sortField, page = 1, limit = 50) {
    const filter = {};
    if (scope === 'college' && scopeValue) filter.college = scopeValue;
    else if (scope === 'branch' && scopeValue) filter.branch = scopeValue;
    else if (scope === 'semester' && scopeValue) filter.semester = scopeValue;

    const skip = (page - 1) * limit;
    const sortObj = { [sortField]: -1 };

    const [entries, total] = await Promise.all([
      UserPoint.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      UserPoint.countDocuments(filter),
    ]);

    return { entries, total, page, limit };
  }

  /**
   * Get a user's rank within a scoped leaderboard
   */
  static async getUserRank(userId, scope, scopeValue, sortField) {
    const record = await UserPoint.findOne({ userId }).lean();
    if (!record) return null;

    const filter = {};
    if (scope === 'college' && scopeValue) filter.college = scopeValue;
    else if (scope === 'branch' && scopeValue) filter.branch = scopeValue;
    else if (scope === 'semester' && scopeValue) filter.semester = scopeValue;

    filter[sortField] = { $gt: record[sortField] };
    const betterCount = await UserPoint.countDocuments(filter);
    return betterCount + 1;
  }

  /**
   * Bulk write points log entries (for batch processing)
   */
  static async bulkInsertLogs(logs) {
    return await PointsLog.insertMany(logs, { ordered: false });
  }

  /**
   * Aggregation: points earned by a user in a date range
   */
  static async aggregatePointsByDateRange(userId, startDate, endDate) {
    return await PointsLog.aggregate([
      {
        $match: {
          userId: typeof userId === 'string' ? require('mongoose').Types.ObjectId.createFromHexString(userId) : userId,
          createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalPoints: { $sum: '$pointsEarned' },
          actionCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  /**
   * Aggregation: top point earners in a date range
   */
  static async getTopEarners(startDate, endDate, limit = 20) {
    return await PointsLog.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
          pointsEarned: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: '$userId',
          totalPoints: { $sum: '$pointsEarned' },
          actionCount: { $sum: 1 },
        },
      },
      { $sort: { totalPoints: -1 } },
      { $limit: limit },
    ]);
  }
}

module.exports = PointsRepository;
