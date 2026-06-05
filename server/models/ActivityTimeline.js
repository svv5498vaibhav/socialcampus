const mongoose = require('mongoose');

const activityTimelineSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true, // Normalized to 00:00:00 start of day
    },
    counts: {
      postsCreated: { type: Number, default: 0 },
      projectsUploaded: { type: Number, default: 0 },
      communitiesJoined: { type: Number, default: 0 },
      resourcesShared: { type: Number, default: 0 },
      eventsAttended: { type: Number, default: 0 },
      teamCollaborations: { type: Number, default: 0 },
      learningActivity: { type: Number, default: 0 },
    },
    totalScore: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

activityTimelineSchema.index({ userId: 1, date: 1 }, { unique: true });
activityTimelineSchema.index({ date: -1 });

module.exports = mongoose.model('ActivityTimeline', activityTimelineSchema);
