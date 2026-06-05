const mongoose = require('mongoose');

const contentPostSchema = new mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10000,
    },
    type: {
      type: String,
      enum: ['project', 'resource', 'achievement', 'internship', 'event', 'blog', 'discussion'],
      required: true,
    },
    mediaUrls: [
      {
        type: String,
        trim: true,
      },
    ],
    tags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
    category: {
      type: String,
      default: 'general',
      trim: true,
    },
    qualityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    readabilityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    completenessScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    aiSuggestions: {
      grammarCorrections: [
        {
          original: String,
          suggested: String,
          reason: String,
        },
      ],
      tagSuggestions: [String],
      captionSuggestions: [String],
      summary: {
        type: String,
        default: '',
      },
    },
    likesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    viewsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'published',
    },
  },
  {
    timestamps: true,
  }
);

contentPostSchema.index({ authorId: 1 });
contentPostSchema.index({ type: 1 });
contentPostSchema.index({ tags: 1 });
contentPostSchema.index({ category: 1 });
contentPostSchema.index({ qualityScore: -1 });
contentPostSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ContentPost', contentPostSchema);
