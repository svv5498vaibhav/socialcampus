const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    pointsCost: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      enum: ['cosmetic', 'benefit', 'physical', 'digital'],
      default: 'benefit',
    },
    stock: {
      type: Number,
      default: -1, // -1 means unlimited stock
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    imageUrl: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ──
rewardSchema.index({ isActive: 1, pointsCost: 1 });
rewardSchema.index({ category: 1, isActive: 1 });

module.exports = mongoose.model('Reward', rewardSchema);
