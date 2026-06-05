const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      trim: true, // e.g. "post_created", "project_uploaded", "community_joined", "resource_shared", "event_attended", "team_collaboration", "learning_completed"
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

userActivitySchema.index({ userId: 1, action: 1 });
userActivitySchema.index({ timestamp: -1 });

module.exports = mongoose.model('UserActivity', userActivitySchema);
