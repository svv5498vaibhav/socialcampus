const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema(
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
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'legendary'],
      default: 'bronze',
    },
    category: {
      type: String,
      enum: [
        'skill',        // technical ability badges
        'community',    // helping, mentoring
        'achievement',  // milestone-linked badges
        'event',        // hackathons, workshops
        'special',      // admin-granted, seasonal
      ],
      default: 'achievement',
    },
    description: {
      type: String,
      required: true,
      trim: true,
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
    rarity: {
      type: String,
      enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
      default: 'common',
    },

    // ── Reward ──
    rewardPoints: {
      type: Number,
      default: 50,
    },
    rewardReputation: {
      type: Number,
      default: 0,
    },

    // ── Rules / Requirements ──
    rules: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    // ── Display ──
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
badgeSchema.index({ tier: 1 });
badgeSchema.index({ category: 1, tier: 1 });
badgeSchema.index({ isActive: 1, sortOrder: 1 });

module.exports = mongoose.model('Badge', badgeSchema);
