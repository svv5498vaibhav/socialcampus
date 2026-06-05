const mongoose = require('mongoose');

const reputationChangeSchema = new mongoose.Schema(
  {
    change: { type: Number, required: true },
    reason: {
      type: String,
      required: true,
      enum: [
        'project_liked',
        'project_saved',
        'comment_helpful',
        'answer_helpful',
        'spam_flagged',
        'content_deleted',
        'consistency_bonus',
        'admin_adjustment',
        'event_participation',
        'hackathon_win',
        'quality_content',
        'mentoring',
      ],
    },
    sourceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userReputationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    // ── Master Score ──
    reputationScore: {
      type: Number,
      default: 1,
      min: 1,
    },

    // ── Multi-Dimensional Sub-Scores ──
    trustScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    contributionScore: {
      type: Number,
      default: 0,
      min: 0,
    },
    communityScore: {
      type: Number,
      default: 0,
      min: 0,
    },
    activityScore: {
      type: Number,
      default: 0,
      min: 0,
    },
    qualityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // ── Legacy Breakdown (backward compatible) ──
    breakdown: {
      contentQuality: { type: Number, default: 0 },
      helpfulComments: { type: Number, default: 0 },
      communityImpact: { type: Number, default: 0 },
      projectSuccess: { type: Number, default: 0 },
      consistency: { type: Number, default: 0 },
    },

    // ── Reputation Tier (derived from reputationScore) ──
    tier: {
      type: String,
      enum: ['newcomer', 'contributor', 'trusted', 'expert', 'authority', 'legend'],
      default: 'newcomer',
    },

    // ── Change History (capped at last 200 entries for performance) ──
    history: {
      type: [reputationChangeSchema],
      default: [],
      validate: {
        validator: function (arr) {
          return arr.length <= 200;
        },
        message: 'Reputation history exceeds 200 entries cap.',
      },
    },

    // ── Denormalized Context ──
    college: { type: String, default: '' },
    branch: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

// ── Static method: derive tier from score ──
userReputationSchema.methods.recalculateTier = function () {
  const s = this.reputationScore;
  if (s >= 10000) this.tier = 'legend';
  else if (s >= 5000) this.tier = 'authority';
  else if (s >= 2000) this.tier = 'expert';
  else if (s >= 500) this.tier = 'trusted';
  else if (s >= 50) this.tier = 'contributor';
  else this.tier = 'newcomer';
  return this.tier;
};

// ── Pre-validate hook: auto-trim history to 200 entries before validation ──
userReputationSchema.pre('validate', function (next) {
  if (this.history && this.history.length > 200) {
    this.history = this.history.slice(-200);
  }
  this.recalculateTier();
  next();
});

// ── Indexes ──
userReputationSchema.index({ reputationScore: -1 });
userReputationSchema.index({ trustScore: -1 });
userReputationSchema.index({ tier: 1, reputationScore: -1 });
userReputationSchema.index({ college: 1, reputationScore: -1 });
userReputationSchema.index({ branch: 1, reputationScore: -1 });

module.exports = mongoose.model('UserReputation', userReputationSchema);
