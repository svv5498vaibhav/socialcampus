const UserReputation = require('../models/UserReputation');

class ReputationRepository {
  /**
   * Find or create a UserReputation record
   */
  static async findOrCreate(userId, contextData = {}) {
    let record = await UserReputation.findOne({ userId });
    if (!record) {
      record = new UserReputation({
        userId,
        reputationScore: 1,
        college: contextData.college || '',
        branch: contextData.branch || '',
      });
      await record.save();
    }
    return record;
  }

  /**
   * Apply a reputation change atomically
   * Returns the updated document
   */
  static async applyChange(userId, change, reason, sourceId = null) {
    const record = await UserReputation.findOne({ userId });
    if (!record) return null;

    const oldScore = record.reputationScore;
    let newScore = oldScore + change;
    if (newScore < 1) newScore = 1;
    const actualChange = newScore - oldScore;

    record.reputationScore = newScore;

    // Update relevant sub-score
    switch (reason) {
      case 'project_liked':
      case 'project_saved':
      case 'quality_content':
        record.contributionScore = (record.contributionScore || 0) + Math.max(0, actualChange);
        record.breakdown.contentQuality += Math.max(0, actualChange);
        break;
      case 'comment_helpful':
      case 'answer_helpful':
      case 'mentoring':
        record.communityScore = (record.communityScore || 0) + Math.max(0, actualChange);
        record.breakdown.helpfulComments += Math.max(0, actualChange);
        break;
      case 'consistency_bonus':
        record.activityScore = (record.activityScore || 0) + Math.max(0, actualChange);
        record.breakdown.consistency += Math.max(0, actualChange);
        break;
      case 'spam_flagged':
      case 'content_deleted':
        record.trustScore = Math.max(0, (record.trustScore || 50) + actualChange);
        record.breakdown.communityImpact += actualChange;
        break;
      case 'event_participation':
      case 'hackathon_win':
        record.communityScore = (record.communityScore || 0) + Math.max(0, actualChange);
        record.breakdown.communityImpact += Math.max(0, actualChange);
        break;
      default:
        record.breakdown.communityImpact += actualChange;
    }

    // Push to capped history
    record.history.push({
      change: actualChange,
      reason,
      sourceId,
      createdAt: new Date(),
    });

    await record.save(); // pre-save hook will trim history and recalculate tier
    return record;
  }

  /**
   * Recalculate quality score from user's content metrics
   */
  static async recalculateQualityScore(userId) {
    const Post = require('../models/Post');
    const posts = await Post.find({ authorId: userId }).select('qualityScore').lean();
    if (posts.length === 0) return 0;

    const avgQuality = posts.reduce((sum, p) => sum + (p.qualityScore || 0), 0) / posts.length;
    await UserReputation.findOneAndUpdate(
      { userId },
      { $set: { qualityScore: Math.round(avgQuality) } }
    );
    return Math.round(avgQuality);
  }

  /**
   * Get reputation leaderboard page (MongoDB fallback)
   */
  static async getReputationLeaderboard(scope, scopeValue, page = 1, limit = 50) {
    const filter = {};
    if (scope === 'college' && scopeValue) filter.college = scopeValue;
    else if (scope === 'branch' && scopeValue) filter.branch = scopeValue;

    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      UserReputation.find(filter)
        .sort({ reputationScore: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserReputation.countDocuments(filter),
    ]);

    return { entries, total, page, limit };
  }

  /**
   * Aggregation: tier distribution analytics
   */
  static async getTierDistribution() {
    return await UserReputation.aggregate([
      { $group: { _id: '$tier', count: { $sum: 1 }, avgScore: { $avg: '$reputationScore' } } },
      { $sort: { avgScore: -1 } },
    ]);
  }
}

module.exports = ReputationRepository;
