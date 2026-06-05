const mongoose = require('mongoose');

const teamMatchSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    targetTeamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectTeam',
      default: null,
    },
    matchType: {
      type: String,
      enum: ['peer_match', 'team_match'],
      required: true,
    },
    compatibilityScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    matchedSkills: [String],
    matchedInterests: [String],
    commonGoals: [String],
    commonAvailability: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['active', 'dismissed', 'accepted'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

teamMatchSchema.index({ userId: 1, status: 1 });
teamMatchSchema.index({ targetTeamId: 1 });
teamMatchSchema.index({ compatibilityScore: -1 });

module.exports = mongoose.model('TeamMatch', teamMatchSchema);
