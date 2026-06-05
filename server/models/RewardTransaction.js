const mongoose = require('mongoose');

const rewardTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rewardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reward',
      required: true,
    },

    // ── Transaction Details ──
    pointsSpent: {
      type: Number,
      required: true,
      min: 0,
    },
    pointsBalanceBefore: {
      type: Number,
      required: true,
    },
    pointsBalanceAfter: {
      type: Number,
      required: true,
    },

    // ── Status Tracking ──
    status: {
      type: String,
      enum: ['pending', 'processing', 'fulfilled', 'rejected', 'refunded'],
      default: 'pending',
    },

    // ── Fulfillment ──
    fulfilledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    fulfilledAt: {
      type: Date,
      default: null,
    },
    fulfillmentNotes: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },

    // ── Refund (if applicable) ──
    refundedAt: {
      type: Date,
      default: null,
    },
    refundReason: {
      type: String,
      default: '',
      trim: true,
    },

    // ── Metadata ──
    ipAddress: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ──
rewardTransactionSchema.index({ userId: 1, createdAt: -1 });
rewardTransactionSchema.index({ rewardId: 1, createdAt: -1 });
rewardTransactionSchema.index({ status: 1, createdAt: -1 });
// Admin dashboard: pending fulfillments
rewardTransactionSchema.index({ status: 1, fulfilledBy: 1 });

module.exports = mongoose.model('RewardTransaction', rewardTransactionSchema);
