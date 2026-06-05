const mongoose = require('mongoose');

const contentAnalyticsSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ContentPost',
      required: true,
      unique: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    clicks: {
      type: Number,
      default: 0,
      min: 0,
    },
    uniqueVisitors: {
      type: Number,
      default: 0,
      min: 0,
    },
    avgReadingDurationMs: {
      type: Number,
      default: 0,
      min: 0,
    },
    avgScrollDepthPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    hoverMetrics: {
      totalHovers: { type: Number, default: 0 },
      avgHoverDurationMs: { type: Number, default: 0 },
    },
    engagementRate: {
      type: Number, // Percentage: (Likes + Comments) / Views
      default: 0,
    },
    dailyMetrics: [
      {
        date: { type: Date, required: true },
        views: { type: Number, default: 0 },
        clicks: { type: Number, default: 0 },
        likes: { type: Number, default: 0 },
        comments: { type: Number, default: 0 },
      },
    ],
  },
  {
    timestamps: true,
  }
);

contentAnalyticsSchema.index({ authorId: 1 });
contentAnalyticsSchema.index({ engagementRate: -1 });

module.exports = mongoose.model('ContentAnalytics', contentAnalyticsSchema);
