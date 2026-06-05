const mongoose = require('mongoose');

const scoreHistorySchema = new mongoose.Schema({
  profileGrowthScore: { type: Number, required: true },
  skillGrowthScore: { type: Number, required: true },
  contributionGrowthScore: { type: Number, required: true },
  communityGrowthScore: { type: Number, required: true },
  careerReadinessScore: { type: Number, required: true },
  recordedAt: { type: Date, default: Date.now },
}, { _id: false });

const growthMetricsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    profileGrowthScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    skillGrowthScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    contributionGrowthScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    communityGrowthScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    careerReadinessScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    history: [scoreHistorySchema],
  },
  {
    timestamps: true,
  }
);

growthMetricsSchema.index({ userId: 1 }, { unique: true });
growthMetricsSchema.index({ careerReadinessScore: -1 });

module.exports = mongoose.model('GrowthMetrics', growthMetricsSchema);
