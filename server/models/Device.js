const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    deviceFingerprint: {
      type: String,
      required: true,
    },
    deviceName: {
      type: String,
      default: 'Unknown Device',
    },
    browser: {
      type: String,
      default: 'Unknown',
    },
    os: {
      type: String,
      default: 'Unknown',
    },
    ipAddress: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      default: 'Unknown',
    },
    trusted: {
      type: Boolean,
      default: false,
    },
    firstSeen: {
      type: Date,
      default: Date.now,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

deviceSchema.index({ userId: 1, deviceFingerprint: 1 }, { unique: true });
deviceSchema.index({ userId: 1 });

module.exports = mongoose.model('Device', deviceSchema);
