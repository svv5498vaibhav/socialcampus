const mongoose = require('mongoose');

const antiCheatLogSchema = new mongoose.Schema(
  {
    // ── Subject ──
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ── Violation Type ──
    violationType: {
      type: String,
      required: true,
      enum: [
        'fake_likes',           // Coordinated upvoting
        'point_farming',        // Repetitive low-effort actions for points
        'spam_engagement',      // Bulk comments/shares with no substance
        'bot_behavior',         // Automated action patterns detected
        'duplicate_actions',    // Repeated like/unlike or save/unsave cycles
        'self_interaction',     // Attempting to like/save own content
        'velocity_exceeded',    // Action rate exceeded threshold
        'ip_collusion',         // Multiple accounts from same IP interacting
        'sybil_attack',         // Fake account network detected
        'content_manipulation', // Mass reporting or coordinated abuse
      ],
    },

    // ── Severity ──
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
    },

    // ── Evidence ──
    evidence: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      // e.g. { targetUserId, postId, actionCount, timeWindow, ipAddress, deviceFingerprint }
    },

    // ── Related Entities ──
    relatedUserIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    relatedPostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      default: null,
    },

    // ── Detection Metadata ──
    detectionMethod: {
      type: String,
      enum: ['middleware', 'cron_scan', 'manual_review', 'ml_detection'],
      default: 'middleware',
    },
    ipAddress: {
      type: String,
      default: null,
    },
    deviceFingerprint: {
      type: String,
      default: null,
    },

    // ── Resolution ──
    status: {
      type: String,
      enum: ['open', 'investigating', 'confirmed', 'dismissed', 'penalized'],
      default: 'open',
    },
    actionTaken: {
      type: String,
      enum: [null, 'warning_issued', 'points_revoked', 'temporary_ban', 'permanent_ban', 'no_action'],
      default: null,
    },
    pointsRevoked: {
      type: Number,
      default: 0,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ──
antiCheatLogSchema.index({ userId: 1, createdAt: -1 });
antiCheatLogSchema.index({ violationType: 1, createdAt: -1 });
antiCheatLogSchema.index({ severity: 1, status: 1 });
antiCheatLogSchema.index({ status: 1, createdAt: -1 });
// Compound: admin dashboard — unresolved violations by severity
antiCheatLogSchema.index({ status: 1, severity: -1, createdAt: -1 });
// IP correlation queries
antiCheatLogSchema.index({ ipAddress: 1, violationType: 1, createdAt: -1 });
// User recurrence frequency
antiCheatLogSchema.index({ userId: 1, violationType: 1, status: 1 });
// TTL: auto-delete dismissed/no_action logs after 90 days
antiCheatLogSchema.index({ resolvedAt: 1 }, { expireAfterSeconds: 90 * 24 * 3600, partialFilterExpression: { actionTaken: 'no_action' } });

module.exports = mongoose.model('AntiCheatLog', antiCheatLogSchema);
