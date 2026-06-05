const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
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
    techStack: [
      {
        type: String,
        trim: true,
      },
    ],
    githubLink: {
      type: String,
      trim: true,
      default: '',
    },
    demoLink: {
      type: String,
      trim: true,
      default: '',
    },
    videoUrl: {
      type: String,
      trim: true,
      default: '',
    },
    screenshotUrls: [
      {
        type: String,
        trim: true,
      },
    ],
    documentation: {
      type: String,
      trim: true,
      default: '', // Markdown documentation
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectTeam',
      default: null,
    },
    category: {
      type: String,
      default: 'general',
      trim: true,
    },
    qualityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    likesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    viewsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['concept', 'in-development', 'completed'],
      default: 'completed',
    },
  },
  {
    timestamps: true,
  }
);

projectSchema.index({ userId: 1 });
projectSchema.index({ teamId: 1 });
projectSchema.index({ category: 1 });
projectSchema.index({ techStack: 1 });
projectSchema.index({ qualityScore: -1 });
projectSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Project', projectSchema);
