const mongoose = require('mongoose');

const communityPostSchema = new mongoose.Schema(
  {
    communityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      required: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    mediaUrls: [
      {
        type: String,
        trim: true,
      },
    ],
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
  },
  {
    timestamps: true,
  }
);

communityPostSchema.index({ communityId: 1, createdAt: -1 });
communityPostSchema.index({ authorId: 1 });

module.exports = mongoose.model('CommunityPost', communityPostSchema);
