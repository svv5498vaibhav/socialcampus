const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to guarantee uniqueness of a like per post per user
likeSchema.index({ postId: 1, userId: 1 }, { unique: true });
likeSchema.index({ userId: 1 });

module.exports = mongoose.model('Like', likeSchema);
