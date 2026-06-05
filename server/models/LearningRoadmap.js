const mongoose = require('mongoose');

const learningRoadmapSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    branch: {
      type: String,
      required: true,
    },
    careerGoal: {
      type: String,
      required: true,
    },
    semesters: [
      {
        semester: { type: Number, required: true },
        topics: [
          {
            name: { type: String, required: true },
            category: {
              type: String,
              enum: ['Foundation', 'Core', 'Advanced', 'Specialization', 'Tooling', 'Practice', 'Career', 'DevOps'],
              default: 'Core',
            },
            priority: {
              type: String,
              enum: ['high', 'medium', 'low'],
              default: 'medium',
            },
            completed: {
              type: Boolean,
              default: false,
            },
          },
        ],
      },
    ],
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

learningRoadmapSchema.index({ userId: 1, careerGoal: 1 }, { unique: true });

module.exports = mongoose.model('LearningRoadmap', learningRoadmapSchema);
