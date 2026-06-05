const mongoose = require('mongoose');

const anonymousPostSchema = new mongoose.Schema(
  {
    hashedStudentId: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 1000,
    },
    type: {
      type: String,
      enum: [
        'suggestion',
        'complaint',
        'issue',
        'academic_concern',
        'facility_concern',
        'faculty_feedback',
        'campus_improvement',
        'general_discussion',
      ],
      required: true,
    },
    category: {
      type: String,
      enum: [
        'infrastructure',
        'academics',
        'faculty',
        'events',
        'placement',
        'hostel',
        'library',
        'labs',
        'administration',
        'general',
      ],
      default: 'general',
    },
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      default: 'neutral',
    },
    sentimentScore: {
      type: Number,
      default: 0,
      min: -1,
      max: 1,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
    },
    moderationStatus: {
      type: String,
      enum: ['safe', 'review_required', 'blocked'],
      default: 'safe',
    },
    moderationFlags: [
      {
        type: String,
        enum: ['bullying', 'hate_speech', 'profanity', 'spam', 'toxicity', 'personal_attack', 'harassment'],
      },
    ],
    reportsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isViewable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ──
anonymousPostSchema.index({ moderationStatus: 1, createdAt: -1 });
anonymousPostSchema.index({ category: 1, moderationStatus: 1, createdAt: -1 });
anonymousPostSchema.index({ type: 1, moderationStatus: 1, createdAt: -1 });
anonymousPostSchema.index({ hashedStudentId: 1, createdAt: -1 });

module.exports = mongoose.model('AnonymousPost', anonymousPostSchema);
