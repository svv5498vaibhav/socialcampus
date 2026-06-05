const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AnonymousPost',
      required: true,
    },
    reporterHash: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      enum: ['offensive', 'spam', 'abuse', 'harassment', 'fake_info'],
      required: true,
    },
    details: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ['open', 'resolved', 'dismissed'],
      default: 'open',
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate reports of the same post by the same user hash
reportSchema.index({ postId: 1, reporterHash: 1 }, { unique: true });
reportSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
