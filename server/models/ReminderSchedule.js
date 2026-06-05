const mongoose = require('mongoose');

const reminderScheduleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['profile_completeness', 'project_pending', 'skill_check', 'event_deadline', 'internship_deadline'],
      required: true,
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    triggerDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'cancelled'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

reminderScheduleSchema.index({ userId: 1, status: 1 });
reminderScheduleSchema.index({ scheduledAt: 1 });

module.exports = mongoose.model('ReminderSchedule', reminderScheduleSchema);
