const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    type: {
      type: String,
      enum: ['pdf', 'notes', 'link', 'paper', 'roadmap', 'study_material'],
      required: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: 'general',
      trim: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    downloadsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    likesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

resourceSchema.index({ type: 1 });
resourceSchema.index({ category: 1 });
resourceSchema.index({ uploadedBy: 1 });
resourceSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Resource', resourceSchema);
