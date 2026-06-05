const mongoose = require('mongoose');

const securityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    eventType: {
      type: String,
      enum: [
        'suspicious_registration',
        'duplicate_account',
        'brute_force_attempt',
        'rate_limit_exceeded',
        'invalid_token',
        'session_hijack_attempt',
        'ip_anomaly',
        'device_anomaly',
        'fraud_detected',
        'risk_level_change',
        'account_blocked',
        'account_suspended',
        'manual_review_required',
        'verification_failed',
        'disposable_email',
        'csrf_violation',
        'xss_attempt',
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ['info', 'low', 'medium', 'high', 'critical'],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: null,
    },
    resolved: {
      type: Boolean,
      default: false,
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
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

securityLogSchema.index({ severity: 1, timestamp: -1 });
securityLogSchema.index({ userId: 1, timestamp: -1 });
securityLogSchema.index({ eventType: 1, timestamp: -1 });
securityLogSchema.index({ resolved: 1, severity: 1 });
securityLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 }); // 180-day TTL

module.exports = mongoose.model('SecurityLog', securityLogSchema);
