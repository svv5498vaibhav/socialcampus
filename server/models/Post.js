const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author ID is required'],
    },
    type: {
      type: String,
      required: [true, 'Post type is required'],
      enum: [
        'project',
        'achievement',
        'resource',
        'event',
        'internship',
        'discussion',
        'question',
        'poll',
        'announcement',
      ],
      default: 'discussion',
    },
    title: {
      type: String,
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
      maxlength: [10000, 'Content cannot exceed 10,000 characters'],
    },
    mediaUrls: [
      {
        type: String,
        trim: true,
      },
    ],
    // Holds structural data per post type (e.g. project githubLink, event date, poll options)
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    aiSummary: {
      type: String,
      trim: true,
      default: '',
    },
    hashtags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
    qualityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    spamScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    isSpam: {
      type: Boolean,
      default: false,
    },
    reports: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: { type: String, trim: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    isReported: {
      type: Boolean,
      default: false,
    },
    viewsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    likesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    sharesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    savesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
postSchema.index({ authorId: 1 });
postSchema.index({ type: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ isSpam: 1, isReported: 1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ qualityScore: -1 });

module.exports = mongoose.model('Post', postSchema);
