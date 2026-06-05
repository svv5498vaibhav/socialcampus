const mongoose = require('mongoose');

const verificationRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    emailVerification: {
      type: String,
      enum: ['pending', 'verified', 'failed'],
      default: 'pending',
    },
    rollNumberVerification: {
      type: String,
      enum: ['pending', 'verified', 'failed', 'skipped'],
      default: 'pending',
    },
    branchVerification: {
      type: String,
      enum: ['pending', 'verified', 'failed'],
      default: 'pending',
    },
    semesterVerification: {
      type: String,
      enum: ['pending', 'verified', 'failed'],
      default: 'pending',
    },
    identityVerification: {
      type: String,
      enum: ['pending', 'verified', 'failed', 'manual_review'],
      default: 'pending',
    },
    overallStatus: {
      type: String,
      enum: ['pending', 'partial', 'verified', 'failed', 'manual_review'],
      default: 'pending',
    },
    verificationData: {
      emailDomain: String,
      emailVerifiedAt: Date,
      rollNumberFormat: String,
      rollNumberVerifiedAt: Date,
      branchMatchedCollege: Boolean,
      branchVerifiedAt: Date,
      semesterValid: Boolean,
      semesterVerifiedAt: Date,
      autoVerificationScore: Number,
      manualReviewReason: String,
      manualReviewedBy: mongoose.Schema.Types.ObjectId,
      manualReviewedAt: Date,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

verificationRecordSchema.index({ userId: 1 }, { unique: true });
verificationRecordSchema.index({ overallStatus: 1 });

// Calculate overall status from individual verifications
verificationRecordSchema.methods.calculateOverallStatus = function () {
  const statuses = [
    this.emailVerification,
    this.rollNumberVerification,
    this.branchVerification,
    this.semesterVerification,
  ];

  if (statuses.every((s) => s === 'verified')) {
    this.overallStatus = 'verified';
    this.verifiedAt = new Date();
  } else if (statuses.some((s) => s === 'failed')) {
    this.overallStatus = 'failed';
  } else if (statuses.some((s) => s === 'verified')) {
    this.overallStatus = 'partial';
  } else {
    this.overallStatus = 'pending';
  }

  return this.overallStatus;
};

module.exports = mongoose.model('VerificationRecord', verificationRecordSchema);
