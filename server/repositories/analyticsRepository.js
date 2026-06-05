const EngagementMetric = require('../models/EngagementMetric');
const ReminderSchedule = require('../models/ReminderSchedule');
const UserAnalytics = require('../models/UserAnalytics');

class AnalyticsRepository {
  // --- Engagement Metrics ---
  static async getEngagementMetric(userId) {
    let metric = await EngagementMetric.findOne({ userId }).lean();
    if (!metric) {
      metric = new EngagementMetric({ userId });
      await metric.save();
      metric = metric.toObject();
    }
    return metric;
  }

  static async updateEngagementMetric(userId, sessionDurationMs = 0) {
    const existing = await EngagementMetric.findOne({ userId }).lean();
    
    let sessionCount = 1;
    let avgSessionDurationMs = sessionDurationMs;
    let totalTimeSpentMs = sessionDurationMs;

    if (existing) {
      sessionCount = existing.sessionCount + 1;
      totalTimeSpentMs = existing.totalTimeSpentMs + sessionDurationMs;
      avgSessionDurationMs = Math.round(totalTimeSpentMs / sessionCount);
    }

    return await EngagementMetric.findOneAndUpdate(
      { userId },
      {
        $set: {
          sessionCount,
          avgSessionDurationMs,
          totalTimeSpentMs,
          lastActiveAt: new Date(),
          status: 'active',
        },
      },
      { upsert: true, new: true }
    );
  }

  static async updateEngagementStatus(userId, churnRisk, status) {
    return await EngagementMetric.findOneAndUpdate(
      { userId },
      { $set: { churnRisk, status } },
      { new: true }
    );
  }

  // --- Reminders ---
  static async createReminderSchedule(userId, title, type, scheduledAt, triggerDetails = {}) {
    const reminder = new ReminderSchedule({ userId, title, type, scheduledAt, triggerDetails });
    await reminder.save();
    return reminder;
  }

  static async getReminderSchedules(userId, status = 'pending') {
    return await ReminderSchedule.find({ userId, status })
      .sort({ scheduledAt: 1 })
      .lean();
  }

  static async updateReminderStatus(reminderId, status) {
    return await ReminderSchedule.findByIdAndUpdate(
      reminderId,
      { $set: { status } },
      { new: true }
    );
  }

  // --- User Analytics ---
  static async getUserAnalytics(userId) {
    let analytics = await UserAnalytics.findOne({ userId }).lean();
    if (!analytics) {
      analytics = new UserAnalytics({ userId });
      await analytics.save();
      analytics = analytics.toObject();
    }
    return analytics;
  }

  static async updateUserAnalytics(userId, data) {
    return await UserAnalytics.findOneAndUpdate(
      { userId },
      {
        $set: {
          ...data,
          lastCalculatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );
  }
}

module.exports = AnalyticsRepository;
