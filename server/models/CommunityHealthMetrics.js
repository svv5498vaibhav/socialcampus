const mongoose = require('mongoose');

const communityHealthMetricsSchema = new mongoose.Schema(
  {
    date: {
      type: String, // YYYY-MM-DD format
      required: true,
    },
    healthScore: {
      type: Number,
      required: true,
      default: 100,
      min: 0,
      max: 100,
    },
    totalPosts: {
      type: Number,
      default: 0,
    },
    blockedPosts: {
      type: Number,
      default: 0,
    },
    reportedPosts: {
      type: Number,
      default: 0,
    },
    sentimentDistribution: {
      positive: { type: Number, default: 0 },
      neutral: { type: Number, default: 0 },
      negative: { type: Number, default: 0 },
    },
    resolvedIssues: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

communityHealthMetricsSchema.index({ date: 1 }, { unique: true });

module.exports = mongoose.model('CommunityHealthMetrics', communityHealthMetricsSchema);
