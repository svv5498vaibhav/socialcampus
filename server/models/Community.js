const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    type: {
      type: String,
      enum: ['branch', 'semester', 'technology', 'college', 'project'],
      required: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    bannerUrl: {
      type: String,
      default: '',
    },
    membersCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    postsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

communitySchema.index({ type: 1 });
communitySchema.index({ topic: 1 });

module.exports = mongoose.model('Community', communitySchema);
