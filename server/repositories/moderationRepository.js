const ModerationLog = require('../models/ModerationLog');
const CommunityHealthMetrics = require('../models/CommunityHealthMetrics');
const Escalation = require('../models/Escalation');
const TrustSafetyLog = require('../models/TrustSafetyLog');

class ModerationRepository {
  /**
   * Log moderation action
   */
  static async logModerationAction(logData) {
    return await ModerationLog.create(logData);
  }

  /**
   * Find community health metrics by date
   */
  static async getCommunityHealth(dateStr) {
    return await CommunityHealthMetrics.findOne({ date: dateStr }).lean();
  }

  /**
   * Upsert community health metrics for a date
   */
  static async updateCommunityHealth(dateStr, updateData) {
    return await CommunityHealthMetrics.findOneAndUpdate(
      { date: dateStr },
      { $set: updateData },
      { new: true, upsert: true }
    );
  }

  /**
   * Create an escalation
   */
  static async createEscalation(escalationData) {
    return await Escalation.create(escalationData);
  }

  /**
   * Resolve an escalation
   */
  static async resolveEscalation(escalationId, adminId, notes) {
    return await Escalation.findByIdAndUpdate(
      escalationId,
      {
        $set: {
          status: 'resolved',
          resolvedBy: adminId,
          resolvedAt: new Date(),
          resolutionNotes: notes,
        },
      },
      { new: true }
    );
  }

  /**
   * Find pending escalations
   */
  static async getPendingEscalations(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [escalations, total] = await Promise.all([
      Escalation.find({ status: 'pending' })
        .populate('postId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Escalation.countDocuments({ status: 'pending' }),
    ]);

    return { escalations, total, page, limit };
  }

  /**
   * Log a Trust & Safety security audit event
   */
  static async logTrustSafetyEvent(eventData) {
    return await TrustSafetyLog.create(eventData);
  }
}

module.exports = ModerationRepository;
