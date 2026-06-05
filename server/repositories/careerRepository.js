const CareerInsight = require('../models/CareerInsight');
const CareerRecommendation = require('../models/CareerRecommendation');
const InternshipRecommendation = require('../models/InternshipRecommendation');
const LearningProgress = require('../models/LearningProgress');

class CareerRepository {
  // --- Insights ---
  static async getInsights(userId) {
    let insight = await CareerInsight.findOne({ userId }).lean();
    if (!insight) {
      insight = new CareerInsight({ userId });
      await insight.save();
      insight = insight.toObject();
    }
    return insight;
  }

  static async upsertInsights(userId, data) {
    return await CareerInsight.findOneAndUpdate(
      { userId },
      {
        $set: {
          identifiedGaps: data.identifiedGaps,
          roadmapsSuggested: data.roadmapsSuggested,
          suggestions: data.suggestions,
          growthOpportunities: data.growthOpportunities,
        },
      },
      { upsert: true, new: true }
    );
  }

  // --- Career Path Recommendations ---
  static async saveCareerRecommendations(userId, recommendations) {
    await CareerRecommendation.deleteMany({ userId });
    if (recommendations.length === 0) return [];
    const recommendationsWithUser = recommendations.map(rec => ({
      ...rec,
      userId,
    }));
    return await CareerRecommendation.insertMany(recommendationsWithUser);
  }

  static async getCareerRecommendations(userId) {
    return await CareerRecommendation.find({ userId, status: 'active' })
      .sort({ matchPercent: -1 })
      .lean();
  }

  // --- Job & Internship Matches ---
  static async saveInternshipRecommendations(userId, matches) {
    await InternshipRecommendation.deleteMany({ userId });
    if (matches.length === 0) return [];
    return await InternshipRecommendation.insertMany(matches);
  }

  static async getInternshipRecommendations(userId, filters = {}) {
    const query = { userId };
    if (filters.status) query.status = filters.status;
    if (filters.type) query.type = filters.type;

    return await InternshipRecommendation.find(query)
      .sort({ matchScore: -1 })
      .lean();
  }

  static async updateInternshipStatus(recommendationId, status) {
    return await InternshipRecommendation.findByIdAndUpdate(
      recommendationId,
      { $set: { status } },
      { new: true }
    );
  }

  // --- Learning Progress ---
  static async getLearningProgress(userId) {
    let progress = await LearningProgress.findOne({ userId }).lean();
    if (!progress) {
      progress = new LearningProgress({ userId });
      await progress.save();
      progress = progress.toObject();
    }
    return progress;
  }

  static async updateLearningProgress(userId, updateData) {
    return await LearningProgress.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { upsert: true, new: true }
    );
  }
}

module.exports = CareerRepository;
