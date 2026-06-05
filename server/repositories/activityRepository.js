const UserActivity = require('../models/UserActivity');
const ActivityTimeline = require('../models/ActivityTimeline');

class ActivityRepository {
  static async logAction(userId, action, details = {}) {
    const log = new UserActivity({ userId, action, details });
    await log.save();
    return log;
  }

  static async getUserActivities(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const docs = await UserActivity.find({ userId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await UserActivity.countDocuments({ userId });
    return { docs, total, page, limit };
  }

  static async upsertDailyTimeline(userId, date, actionField, scoreWeight = 1) {
    // Normalize date to start of day
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    const update = {
      $inc: {
        [`counts.${actionField}`]: 1,
        totalScore: scoreWeight,
      },
    };

    return await ActivityTimeline.findOneAndUpdate(
      { userId, date: normalizedDate },
      update,
      { upsert: true, new: true }
    );
  }

  static async getTimeline(userId, startDate, endDate) {
    const query = { userId };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    return await ActivityTimeline.find(query)
      .sort({ date: 1 })
      .lean();
  }

  static async getActivityAggregates(userId, sinceDate = null) {
    const match = { userId };
    if (sinceDate) {
      match.timestamp = { $gte: sinceDate };
    }

    return await UserActivity.aggregate([
      { $match: match },
      { $group: { _id: '$action', count: { $sum: 1 } } }
    ]);
  }
}

module.exports = ActivityRepository;
