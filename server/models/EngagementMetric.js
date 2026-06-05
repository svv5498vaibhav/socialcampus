const mongoose = require('mongoose');

const engagementMetricSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sessionCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    avgSessionDurationMs: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalTimeSpentMs: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    churnRisk: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'churned'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

engagementMetricSchema.index({ userId: 1 }, { unique: true });
engagementMetricSchema.index({ status: 1 });
engagementMetricSchema.index({ lastActiveAt: -1 });

module.exports = mongoose.model('EngagementMetric', engagementMetricSchema);
