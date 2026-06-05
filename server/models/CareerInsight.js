const mongoose = require('mongoose');

const careerInsightSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    identifiedGaps: [
      {
        type: String,
        trim: true,
      },
    ],
    roadmapsSuggested: [
      {
        title: { type: String, required: true },
        steps: [String],
        completed: { type: Boolean, default: false },
      },
    ],
    suggestions: [
      {
        type: String,
        trim: true,
      },
    ],
    growthOpportunities: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

careerInsightSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('CareerInsight', careerInsightSchema);
