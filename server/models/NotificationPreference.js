const mongoose = require('mongoose');

const notificationPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Channels preference per notification type category
    preferences: {
      likes: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        inApp: { type: Boolean, default: true },
      },
      comments: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        inApp: { type: Boolean, default: true },
      },
      mentions: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        inApp: { type: Boolean, default: true },
      },
      follows: {
        email: { type: Boolean, default: false },
        push: { type: Boolean, default: true },
        inApp: { type: Boolean, default: true },
      },
      invitations: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        inApp: { type: Boolean, default: true },
      },
      achievements: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        inApp: { type: Boolean, default: true },
      },
      opportunities: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        inApp: { type: Boolean, default: true },
      },
    },
  },
  {
    timestamps: true,
  }
);

notificationPreferenceSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('NotificationPreference', notificationPreferenceSchema);
