const mongoose = require('mongoose');

const trustSafetyLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
    },
    userIdHash: {
      type: String,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only need creation time
  }
);

// TTL index to automatically prune trust logs after 180 days for data minimization
trustSafetyLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 3600 });
trustSafetyLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('TrustSafetyLog', trustSafetyLogSchema);
