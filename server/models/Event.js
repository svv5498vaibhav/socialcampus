const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
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
      maxlength: 2000,
    },
    type: {
      type: String,
      enum: ['workshop', 'hackathon', 'seminar', 'meetup', 'competition'],
      required: true,
    },
    mode: {
      type: String,
      enum: ['online', 'offline'],
      default: 'online',
    },
    venueOrLink: {
      type: String,
      required: true,
      trim: true,
    },
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    communityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      default: null,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    registrationDeadline: {
      type: Date,
      required: true,
    },
    maxParticipants: {
      type: Number,
      default: 0, // 0 means unlimited
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
    },
    bannerUrl: {
      type: String,
      default: '',
    },
    registeredMembers: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        registeredAt: {
          type: Date,
          default: Date.now,
        },
        attended: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

eventSchema.index({ communityId: 1 });
eventSchema.index({ type: 1 });
eventSchema.index({ startTime: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ organizerId: 1 });

module.exports = mongoose.model('Event', eventSchema);
