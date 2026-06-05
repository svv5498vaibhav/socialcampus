const mongoose = require('mongoose');

const careerRecommendationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    pathTitle: {
      type: String,
      required: true,
      trim: true, // e.g. "Full Stack Developer", "Data Scientist"
    },
    matchPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    reasoning: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'dismissed', 'accepted'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

careerRecommendationSchema.index({ userId: 1, status: 1 });
careerRecommendationSchema.index({ matchPercent: -1 });

module.exports = mongoose.model('CareerRecommendation', careerRecommendationSchema);
