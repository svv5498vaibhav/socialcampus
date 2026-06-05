const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 50,
    },
    type: {
      type: String,
      enum: ['technology', 'project', 'career', 'event', 'general'],
      default: 'general',
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

tagSchema.index({ type: 1 });
tagSchema.index({ usageCount: -1 });

module.exports = mongoose.model('Tag', tagSchema);
