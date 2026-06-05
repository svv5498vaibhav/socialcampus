const mongoose = require('mongoose');

const mentorshipSchema = new mongoose.Schema(
  {
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    menteeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    goals: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    message: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed'],
      default: 'pending',
    },
    sessions: [
      {
        title: {
          type: String,
          required: true,
          trim: true,
        },
        scheduledAt: {
          type: Date,
          required: true,
        },
        meetingLink: {
          type: String,
          trim: true,
          default: '',
        },
        completed: {
          type: Boolean,
          default: false,
        },
      },
    ],
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
      comment: {
        type: String,
        trim: true,
        default: '',
      },
    },
  },
  {
    timestamps: true,
  }
);

mentorshipSchema.index({ mentorId: 1, menteeId: 1 });
mentorshipSchema.index({ status: 1 });

module.exports = mongoose.model('Mentorship', mentorshipSchema);
