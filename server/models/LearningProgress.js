const mongoose = require('mongoose');

const completedCourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  platform: { type: String, required: true },
  completedAt: { type: Date, default: Date.now },
}, { _id: false });

const activeRoadmapSchema = new mongoose.Schema({
  roadmapId: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningRoadmap' },
  title: { type: String, required: true },
  currentStepIndex: { type: Number, default: 0 },
  stepsCount: { type: Number, required: true },
}, { _id: false });

const learningProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    skillsAcquired: [
      {
        type: String,
        trim: true,
      },
    ],
    completedCourses: [completedCourseSchema],
    activeRoadmaps: [activeRoadmapSchema],
    completedProjectsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

learningProgressSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('LearningProgress', learningProgressSchema);
