const mongoose = require('mongoose');

const communityRecommendationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    communityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      required: true,
    },
    recommendationScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    signals: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ['active', 'joined', 'dismissed'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

communityRecommendationSchema.index({ userId: 1, status: 1 });
communityRecommendationSchema.index({ communityId: 1 });
communityRecommendationSchema.index({ recommendationScore: -1 });

module.exports = mongoose.model('CommunityRecommendation', communityRecommendationSchema);
