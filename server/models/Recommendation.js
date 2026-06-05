const mongoose = require('mongoose');

const recommendedItemSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
  score: { type: Number, default: 0 },
  reason: { type: String, default: '' },
}, { _id: false });

const recommendationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recommendedStudents: [{
      studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      score: { type: Number, default: 0 },
      reason: { type: String, default: '' },
    }],
    recommendedProjects: [recommendedItemSchema],
    recommendedCommunities: [{
      communityId: { type: String, required: true }, // e.g. club name or slug
      score: { type: Number, default: 0 },
      reason: { type: String, default: '' },
    }],
    recommendedEvents: [recommendedItemSchema],
    recommendedInternships: [recommendedItemSchema],
    recommendedResources: [recommendedItemSchema],
  },
  {
    timestamps: true,
  }
);

recommendationSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('Recommendation', recommendationSchema);
