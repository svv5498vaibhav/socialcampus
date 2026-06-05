const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null for system/AI generated notifications
    },
    type: {
      type: String,
      required: true,
      enum: [
        'like',
        'comment',
        'mention',
        'follow',
        'invite',
        'achievement',
        'trending',
        'team_invite',
        'community_invite',
        'event_invite',
        'badge_unlock',
        'rank_change',
        'internship_opp',
      ],
    },
    postId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipientId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
