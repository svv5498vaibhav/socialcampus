const mongoose = require('mongoose');

const loginLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    action: {
      type: String,
      enum: [
        'login_success',
        'login_failed',
        'logout',
        'logout_all',
        'register',
        'token_refresh',
        'password_change',
        'password_reset',
        'account_locked',
        'account_unlocked',
      ],
      required: true,
    },
    email: {
      type: String,
      default: null,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['success', 'failure', 'warning'],
      required: true,
    },
    failureReason: {
      type: String,
      default: null,
    },
    deviceFingerprint: {
      type: String,
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

loginLogSchema.index({ userId: 1, timestamp: -1 });
loginLogSchema.index({ ipAddress: 1, timestamp: -1 });
loginLogSchema.index({ action: 1, timestamp: -1 });
loginLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // Auto-delete after 90 days

module.exports = mongoose.model('LoginLog', loginLogSchema);
