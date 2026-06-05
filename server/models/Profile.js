const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 500 },
  techStack: [{ type: String, trim: true }],
  link: { type: String, trim: true },
  startDate: { type: Date },
  endDate: { type: Date },
}, { _id: true });

const certificationSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  issuer: { type: String, trim: true, maxlength: 100 },
  date: { type: Date },
  link: { type: String, trim: true },
}, { _id: true });

const achievementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 300 },
  date: { type: Date },
}, { _id: true });

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ── Personal ──
    username: {
      type: String,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      match: [/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores'],
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    avatarUrl: {
      type: String,
      trim: true,
      default: '',
    },

    // ── Professional ──
    skills: [{
      type: String,
      trim: true,
    }],
    interests: [{
      type: String,
      trim: true,
    }],
    projects: [projectSchema],
    certifications: [certificationSchema],
    achievements: [achievementSchema],

    // ── Career ──
    careerGoals: [{
      type: String,
      trim: true,
    }],
    preferredDomains: [{
      type: String,
      trim: true,
    }],
    internshipInterests: [{
      type: String,
      trim: true,
    }],
    higherEducationGoals: {
      type: String,
      enum: ['MS Abroad', 'MBA', 'MTech India', 'PhD', 'Job after BTech', 'Entrepreneurship', 'Undecided', ''],
      default: '',
    },

    // ── AI-Generated ──
    generatedBio: {
      type: String,
      trim: true,
      default: '',
    },
    profileCompletionScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    profileLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'campus_pro'],
      default: 'beginner',
    },
    recommendedCareerPaths: [{
      type: String,
      trim: true,
    }],

    // ── Onboarding ──
    onboardingStep: {
      type: Number,
      default: 1,
      min: 1,
      max: 8,
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    following: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    followers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
  },
  {
    timestamps: true,
  }
);

// Indexes
profileSchema.index({ userId: 1 }, { unique: true });
profileSchema.index({ username: 1 }, { unique: true, sparse: true });
profileSchema.index({ skills: 1 });
profileSchema.index({ interests: 1 });
profileSchema.index({ profileLevel: 1 });
profileSchema.index({ onboardingCompleted: 1 });
profileSchema.index({ profileCompletionScore: -1 });

module.exports = mongoose.model('Profile', profileSchema);
