const mongoose = require('mongoose');

const rankingHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ── Leaderboard Scope ──
    leaderboardType: {
      type: String,
      required: true,
      enum: ['overall', 'branch', 'college', 'semester', 'weekly', 'monthly', 'innovation', 'community'],
      default: 'overall',
    },
    scopeValue: {
      type: String,
      default: '', // e.g. branch name, college name — empty for overall/weekly/monthly
      trim: true,
    },

    // ── Ranking Data ──
    currentRank: {
      type: Number,
      required: true,
    },
    previousRank: {
      type: Number,
      default: null, // null on first snapshot
    },
    rankChange: {
      type: Number,
      default: 0, // positive = moved up, negative = moved down
    },

    // ── Score Data ──
    points: {
      type: Number,
      required: true,
    },
    reputation: {
      type: Number,
      default: 0,
    },

    // ── Percentile (for analytics dashboards) ──
    percentile: {
      type: Number,
      default: 0, // e.g. 95 means top 5%
      min: 0,
      max: 100,
    },

    // ── Snapshot Metadata ──
    snapshotDate: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    totalParticipants: {
      type: Number,
      default: 0, // total users in this leaderboard at snapshot time
    },
  },
  {
    timestamps: false,
  }
);

// ── Indexes ──
// Primary lookup: user's ranking history for a specific leaderboard scope
rankingHistorySchema.index({ userId: 1, leaderboardType: 1, snapshotDate: -1 });
// Unique constraint: one snapshot per user per leaderboard per day
rankingHistorySchema.index({ userId: 1, leaderboardType: 1, scopeValue: 1, snapshotDate: 1 }, { unique: true });
// Trend analysis: top movers
rankingHistorySchema.index({ leaderboardType: 1, snapshotDate: 1, rankChange: -1 });

module.exports = mongoose.model('RankingHistory', rankingHistorySchema);
