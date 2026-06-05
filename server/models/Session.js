const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    refreshToken: {
      type: String,
      required: true,
      select: false,
    },
    deviceId: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    rememberMe: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

sessionSchema.index({ userId: 1, isActive: 1 });
sessionSchema.index({ refreshToken: 1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index — auto-delete expired sessions
sessionSchema.index({ deviceId: 1 });

module.exports = mongoose.model('Session', sessionSchema);
