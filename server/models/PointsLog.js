const mongoose = require('mongoose');

const pointsLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actionType: {
      type: String,
      required: true,
      enum: [
        'project_posted',
        'project_liked',
        'project_saved',
        'comment_added',
        'helpful_answer',
        'community_participation',
        'event_participation',
        'hackathon_participation',
        'achievement_earned',
        'profile_completion',
        'daily_activity',
        'admin_adjustment',
      ],
    },
    pointsEarned: {
      type: Number,
      required: true,
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null, // e.g., PostId or CommentId that triggered the points
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only log timestamp on creation
  }
);

pointsLogSchema.index({ userId: 1, createdAt: -1 });
pointsLogSchema.index({ userId: 1, actionType: 1, createdAt: -1 });
pointsLogSchema.index({ sourceId: 1 });

module.exports = mongoose.model('PointsLog', pointsLogSchema);
