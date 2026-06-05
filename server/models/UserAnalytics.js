const mongoose = require('mongoose');

const userAnalyticsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    profileCompletionScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    totalPostsCreated: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalProjectsUploaded: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalResourcesShared: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalEventsAttended: {
      type: Number,
      default: 0,
      min: 0,
    },
    learningProgressScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    overallActivityScore: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastCalculatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

userAnalyticsSchema.index({ userId: 1 }, { unique: true });
userAnalyticsSchema.index({ overallActivityScore: -1 });

module.exports = mongoose.model('UserAnalytics', userAnalyticsSchema);
