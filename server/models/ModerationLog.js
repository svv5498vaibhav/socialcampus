const mongoose = require('mongoose');

const moderationLogSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AnonymousPost',
      required: true,
    },
    action: {
      type: String,
      enum: ['approved', 'blocked', 'flagged', 'escalated'],
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    decisionSource: {
      type: String,
      enum: ['auto_moderator', 'admin_manual'],
      default: 'auto_moderator',
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only need created timestamp for log history
  }
);

moderationLogSchema.index({ postId: 1 });
moderationLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('ModerationLog', moderationLogSchema);
