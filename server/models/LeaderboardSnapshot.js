const mongoose = require('mongoose');

const leaderboardEntrySchema = new mongoose.Schema(
  {
    rank: { type: Number, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    score: { type: Number, required: true },
    previousRank: { type: Number, default: null },
    rankChange: { type: Number, default: 0 },
  },
  { _id: false }
);

const leaderboardSnapshotSchema = new mongoose.Schema(
  {
    // ── Scope ──
    leaderboardType: {
      type: String,
      required: true,
      enum: ['overall', 'branch', 'college', 'semester', 'weekly', 'monthly', 'innovation', 'community'],
    },
    scopeValue: {
      type: String,
      default: '', // e.g. "Computer Science" for branch scope
      trim: true,
    },

    // ── Snapshot Data ──
    snapshotDate: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    topEntries: {
      type: [leaderboardEntrySchema],
      default: [],
      validate: {
        validator: function (arr) {
          return arr.length <= 500;
        },
        message: 'Snapshot capped at 500 entries.',
      },
    },

    // ── Aggregated Statistics ──
    stats: {
      totalParticipants: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      medianScore: { type: Number, default: 0 },
      topScore: { type: Number, default: 0 },
      bottomScore: { type: Number, default: 0 },
      standardDeviation: { type: Number, default: 0 },
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// ── Indexes ──
// Primary lookup: specific leaderboard on a specific date
leaderboardSnapshotSchema.index({ leaderboardType: 1, scopeValue: 1, snapshotDate: -1 });
// Unique constraint: one snapshot per leaderboard scope per day
leaderboardSnapshotSchema.index({ leaderboardType: 1, scopeValue: 1, snapshotDate: 1 }, { unique: true });
// Date range queries for trend analytics
leaderboardSnapshotSchema.index({ snapshotDate: 1 });
// TTL: keep snapshots for 365 days
leaderboardSnapshotSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 3600 });

module.exports = mongoose.model('LeaderboardSnapshot', leaderboardSnapshotSchema);
