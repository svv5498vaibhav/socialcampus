const mongoose = require('mongoose');

const userRewardSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ['claimed', 'delivered'],
      default: 'claimed',
    },
    redeemedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

userRewardSchema.index({ userId: 1 });

module.exports = mongoose.model('UserReward', userRewardSchema);
