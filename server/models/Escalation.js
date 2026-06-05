const mongoose = require('mongoose');

const escalationSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AnonymousPost',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'resolved'],
      default: 'pending',
    },
    escalatedTo: {
      type: String,
      enum: ['dean', 'warden', 'director', 'IT_admin'],
      required: true,
    },
    escalationReason: {
      type: String,
      required: true,
      trim: true,
    },
    resolutionNotes: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

escalationSchema.index({ status: 1, createdAt: -1 });
escalationSchema.index({ postId: 1 });

module.exports = mongoose.model('Escalation', escalationSchema);
