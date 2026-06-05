const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        // ── Content Actions ──
        'create_post',
        'like_post',
        'comment_post',
        'save_post',
        'share_post',
        'vote_poll',

        // ── Social Actions ──
        'follow_user',
        'unfollow_user',

        // ── Gamification Actions ──
        'badge_earned',
        'achievement_unlocked',
        'points_awarded',
        'reputation_changed',
        'rank_changed',
        'streak_extended',
        'reward_redeemed',

        // ── Event Actions ──
        'event_joined',
        'event_created',
        'hackathon_participated',
        'hackathon_won',

        // ── Project Actions ──
        'project_created',
        'project_updated',
        'project_starred',

        // ── Moderation Actions ──
        'content_reported',
        'content_flagged',
        'comment_marked_helpful',

        // ── Profile Actions ──
        'profile_updated',
        'profile_completed',
      ],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    targetType: {
      type: String,
      enum: ['post', 'comment', 'user', 'badge', 'achievement', 'reward', 'event', null],
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // ── Points impact of this activity ──
    pointsImpact: {
      type: Number,
      default: 0,
    },
    // ── IP for anti-cheat correlation ──
    ipAddress: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// ── Indexes ──
activitySchema.index({ userId: 1, createdAt: -1 });
activitySchema.index({ action: 1, createdAt: -1 });
activitySchema.index({ targetId: 1, action: 1 });
// Compound: user's actions by type for analytics
activitySchema.index({ userId: 1, action: 1, createdAt: -1 });
// IP-based anti-cheat queries
activitySchema.index({ ipAddress: 1, action: 1, createdAt: -1 });
// TTL: keep activity logs for 180 days (6 months)
activitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 3600 });

module.exports = mongoose.model('Activity', activitySchema);
