const GrowthMetrics = require('../models/GrowthMetrics');

class GrowthRepository {
  static async getGrowthMetrics(userId) {
    let metrics = await GrowthMetrics.findOne({ userId }).lean();
    if (!metrics) {
      metrics = new GrowthMetrics({ userId });
      await metrics.save();
      metrics = metrics.toObject();
    }
    return metrics;
  }

  static async updateGrowthMetrics(userId, scores) {
    const historyEntry = {
      profileGrowthScore: scores.profileGrowthScore || 0,
      skillGrowthScore: scores.skillGrowthScore || 0,
      contributionGrowthScore: scores.contributionGrowthScore || 0,
      communityGrowthScore: scores.communityGrowthScore || 0,
      careerReadinessScore: scores.careerReadinessScore || 0,
      recordedAt: new Date(),
    };

    // Update current scores and push to history, capping history list length to 100 items
    const doc = await GrowthMetrics.findOneAndUpdate(
      { userId },
      {
        $set: {
          profileGrowthScore: scores.profileGrowthScore,
          skillGrowthScore: scores.skillGrowthScore,
          contributionGrowthScore: scores.contributionGrowthScore,
          communityGrowthScore: scores.communityGrowthScore,
          careerReadinessScore: scores.careerReadinessScore,
        },
        $push: {
          history: {
            $each: [historyEntry],
            $slice: -100 // keep last 100 entries
          }
        }
      },
      { upsert: true, new: true }
    );

    return doc;
  }
}

module.exports = GrowthRepository;
