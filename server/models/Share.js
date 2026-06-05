const mongoose = require('mongoose');

const shareSchema = new mongoose.Schema(
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
    platform: {
      type: String,
      default: 'internal',
      enum: ['internal', 'linkedin', 'twitter', 'facebook', 'whatsapp', 'clipboard'],
    },
  },
  {
    timestamps: true,
  }
);

shareSchema.index({ postId: 1 });
shareSchema.index({ userId: 1 });

module.exports = mongoose.model('Share', shareSchema);
