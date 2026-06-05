const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    rollNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    college: {
      type: String,
      required: [true, 'College name is required'],
      trim: true,
    },
    branch: {
      type: String,
      required: [true, 'Branch is required'],
      trim: true,
    },
    semester: {
      type: String,
      required: [true, 'Semester is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['student', 'admin', 'moderator'],
      default: 'student',
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'suspended', 'blocked', 'deactivated'],
      default: 'pending',
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    lastLoginIp: {
      type: String,
      default: null,
    },
    registrationIp: {
      type: String,
      default: null,
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ rollNumber: 1 }, { unique: true, sparse: true });
userSchema.index({ status: 1, riskLevel: 1 });
userSchema.index({ college: 1 });
userSchema.index({ createdAt: -1 });

// Virtual: full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Instance method: check if account is locked
userSchema.methods.isLocked = function () {
  if (!this.lockedUntil) return false;
  return this.lockedUntil > new Date();
};

// Instance method: get safe profile
userSchema.methods.toProfile = function () {
  return {
    id: this._id,
    email: this.email,
    firstName: this.firstName,
    lastName: this.lastName,
    fullName: this.fullName,
    rollNumber: this.rollNumber,
    college: this.college,
    branch: this.branch,
    semester: this.semester,
    role: this.role,
    status: this.status,
    emailVerified: this.emailVerified,
    isVerified: this.isVerified,
    riskLevel: this.riskLevel,
    onboardingCompleted: this.onboardingCompleted,
    lastLoginAt: this.lastLoginAt,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
