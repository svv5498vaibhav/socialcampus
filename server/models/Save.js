const mongoose = require('mongoose');

const saveSchema = new mongoose.Schema(
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

// Compound index to guarantee uniqueness of a bookmark per post per user
saveSchema.index({ userId: 1, postId: 1 }, { unique: true });
saveSchema.index({ postId: 1 });

module.exports = mongoose.model('Save', saveSchema);
