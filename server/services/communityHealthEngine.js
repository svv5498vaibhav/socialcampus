const AnonymousPost = require('../models/AnonymousPost');
const ModerationRepository = require('../repositories/moderationRepository');

class CommunityHealthEngine {
  /**
   * Recalculate and save community health metrics for a specific date
   * @param {string} dateStr - YYYY-MM-DD
   */
  static async calculateHealthScore(dateStr) {
    const start = new Date(`${dateStr}T00:00:00.000Z`);
    const end = new Date(`${dateStr}T23:59:59.999Z`);

    // Fetch database aggregates for this date range
    const [total, blocked, reported, negativeCount, positiveCount, neutralCount] = await Promise.all([
      AnonymousPost.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      AnonymousPost.countDocuments({ createdAt: { $gte: start, $lte: end }, moderationStatus: 'blocked' }),
      AnonymousPost.countDocuments({ createdAt: { $gte: start, $lte: end }, reportsCount: { $gt: 0 } }),
      AnonymousPost.countDocuments({ createdAt: { $gte: start, $lte: end }, sentiment: 'negative' }),
      AnonymousPost.countDocuments({ createdAt: { $gte: start, $lte: end }, sentiment: 'positive' }),
      AnonymousPost.countDocuments({ createdAt: { $gte: start, $lte: end }, sentiment: 'neutral' }),
    ]);

    let healthScore = 100;
    if (total > 0) {
      // Index formulation
      const penalty = blocked + (0.5 * reported) + (0.2 * negativeCount);
      const score = 100 * (1 - penalty / total);
      healthScore = Math.max(0, Math.min(100, Math.round(score)));
    }

    const data = {
      date: dateStr,
      healthScore,
      totalPosts: total,
      blockedPosts: blocked,
      reportedPosts: reported,
      sentimentDistribution: {
        positive: positiveCount,
        neutral: neutralCount,
        negative: negativeCount,
      },
    };

    return await ModerationRepository.updateCommunityHealth(dateStr, data);
  }
}

module.exports = CommunityHealthEngine;
