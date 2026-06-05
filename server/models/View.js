const mongoose = require('mongoose');

const viewSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null for anonymous / guest views if any, or non-logged-in
    },
    watchTime: {
      type: Number,
      default: 0, // in seconds
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

viewSchema.index({ postId: 1 });
viewSchema.index({ userId: 1, postId: 1 });
// TTL index: auto delete records older than 30 days (30 * 24 * 3600 = 2,592,000 seconds)
viewSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('View', viewSchema);
