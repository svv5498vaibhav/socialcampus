const mongoose = require('mongoose');

const userPointSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    // ── Aggregate Point Balances ──
    currentPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    lifetimePoints: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ── Time-Windowed Breakdowns (reset by cron) ──
    weeklyPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    monthlyPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    weekKey: {
      type: String, // YYYY-WW format, used to detect week rollover
      default: '',
    },
    monthKey: {
      type: String, // YYYY-MM format, used to detect month rollover
      default: '',
    },

    // ── Category Breakdowns (cumulative) ──
    categoryPoints: {
      projects: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      community: { type: Number, default: 0 },
      events: { type: Number, default: 0 },
      helpfulness: { type: Number, default: 0 },
      innovation: { type: Number, default: 0 },
    },

    // ── Streak & Consistency Tracking ──
    streak: {
      currentStreak: { type: Number, default: 0 },
      longestStreak: { type: Number, default: 0 },
      lastActiveDate: { type: String, default: '' }, // YYYY-MM-DD
    },

    // ── Daily Cap Enforcement ──
    dailyCaps: {
      date: {
        type: String,
        default: () => new Date().toISOString().split('T')[0],
      },
      categories: {
        comments: { type: Number, default: 0 },
        likes: { type: Number, default: 0 },
        saves: { type: Number, default: 0 },
        dailyActivity: { type: Number, default: 0 },
      },
    },

    // ── Denormalized User Context (for leaderboard fallback queries) ──
    college: { type: String, default: '' },
    branch: { type: String, default: '' },
    semester: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

// ── Leaderboard Ranking Indexes (descending for top-N queries) ──
userPointSchema.index({ lifetimePoints: -1 });
userPointSchema.index({ currentPoints: -1 });
userPointSchema.index({ weeklyPoints: -1 });
userPointSchema.index({ monthlyPoints: -1 });

// ── Compound Indexes for Scoped Leaderboards ──
userPointSchema.index({ college: 1, lifetimePoints: -1 });
userPointSchema.index({ branch: 1, lifetimePoints: -1 });
userPointSchema.index({ semester: 1, lifetimePoints: -1 });
userPointSchema.index({ college: 1, weeklyPoints: -1 });
userPointSchema.index({ branch: 1, monthlyPoints: -1 });

// ── Innovation & Community Leaderboard Indexes ──
userPointSchema.index({ 'categoryPoints.innovation': -1 });
userPointSchema.index({ 'categoryPoints.community': -1 });

module.exports = mongoose.model('UserPoint', userPointSchema);
