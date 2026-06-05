const mongoose = require('mongoose');

const projectTeamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          required: true,
          trim: true,
        },
        status: {
          type: String,
          enum: ['pending', 'joined', 'declined'],
          default: 'pending',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    skillsRequired: [
      {
        type: String,
        trim: true,
      },
    ],
    interests: [
      {
        type: String,
        trim: true,
      },
    ],
    projectGoals: {
      type: String,
      trim: true,
      default: '',
    },
    availability: {
      type: String,
      trim: true,
      default: 'flexible', // e.g. "10 hrs/week", "weekends"
    },
    experienceLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'any'],
      default: 'any',
    },
    status: {
      type: String,
      enum: ['recruiting', 'active', 'completed'],
      default: 'recruiting',
    },
  },
  {
    timestamps: true,
  }
);

projectTeamSchema.index({ creatorId: 1 });
projectTeamSchema.index({ skillsRequired: 1 });
projectTeamSchema.index({ status: 1 });

module.exports = mongoose.model('ProjectTeam', projectTeamSchema);
