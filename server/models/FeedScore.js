const mongoose = require('mongoose');

const feedScoreSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    score: {
      type: Number,
      required: true,
      default: 0,
    },
    factors: {
      branchMatch: { type: Boolean, default: false },
      semesterRelevance: { type: Number, default: 0 },
      skillsOverlap: { type: Number, default: 0 },
      interestsOverlap: { type: Number, default: 0 },
      recencyWeight: { type: Number, default: 0 },
      qualityWeight: { type: Number, default: 0 },
      engagementWeight: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to guarantee uniqueness of a score cache per user-post pair
feedScoreSchema.index({ userId: 1, postId: 1 }, { unique: true });
// Index to fetch a user's feed sorted by score descending
feedScoreSchema.index({ userId: 1, score: -1 });
// TTL index: auto delete records older than 7 days (7 * 24 * 3600 = 604,800 seconds) to prevent infinite growth
feedScoreSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 604800 });

module.exports = mongoose.model('FeedScore', feedScoreSchema);
