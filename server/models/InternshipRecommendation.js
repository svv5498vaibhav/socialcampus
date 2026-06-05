const mongoose = require('mongoose');

const internshipRecommendationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['internship', 'job', 'hackathon', 'workshop', 'certification'],
      required: true,
    },
    deadline: {
      type: Date,
      required: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    skillsRequired: [
      {
        type: String,
        trim: true,
      },
    ],
    matchScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['active', 'applied', 'dismissed'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

internshipRecommendationSchema.index({ userId: 1, status: 1 });
internshipRecommendationSchema.index({ matchScore: -1 });

module.exports = mongoose.model('InternshipRecommendation', internshipRecommendationSchema);
