const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },

    // ── Classification ──
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum', 'legendary'],
      default: 'bronze',
    },
    category: {
      type: String,
      enum: [
        'content',      // posting, sharing knowledge
        'community',    // helping, mentoring, events
        'innovation',   // projects, hackathons
        'engagement',   // streaks, consistency
        'milestone',    // point/rank thresholds
      ],
      default: 'milestone',
    },

    // ── Visual ──
    iconUrl: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      default: '#CD7F32', // bronze hex
      trim: true,
    },

    // ── Rewards ──
    pointsReward: {
      type: Number,
      default: 0,
    },
    badgeReward: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Badge',
      default: null, // Optional: unlock a badge when this achievement is earned
    },
    reputationReward: {
      type: Number,
      default: 0,
    },

    // ── Unlock Conditions ──
    milestoneType: {
      type: String,
      required: true,
      enum: [
        'post_count',
        'project_count',
        'like_count',
        'comment_count',
        'point_threshold',
        'rank_position',
        'hackathon_count',
        'community_points',
        'streak_days',
        'helpful_count',
        'follower_count',
        'event_count',
        'reputation_threshold',
      ],
    },
    milestoneThreshold: {
      type: Number,
      required: true,
    },
    unlockConditions: {
      type: mongoose.Schema.Types.Mixed,
      default: null, // Additional compound conditions (e.g., { AND: [{ type: 'post_count', value: 10 }, { type: 'like_count', value: 50 }] })
    },

    // ── Display Control ──
    isHidden: {
      type: Boolean,
      default: false, // Hidden achievements are revealed only on unlock
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ──
achievementSchema.index({ milestoneType: 1 });
achievementSchema.index({ category: 1, tier: 1 });
achievementSchema.index({ isActive: 1, sortOrder: 1 });

module.exports = mongoose.model('Achievement', achievementSchema);
