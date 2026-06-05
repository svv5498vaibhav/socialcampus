const mongoose = require('mongoose');

const trustScoreSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    overallScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    breakdown: {
      emailVerified: { type: Number, default: 0, max: 25 },
      rollNumberValid: { type: Number, default: 0, max: 20 },
      branchMatched: { type: Number, default: 0, max: 15 },
      semesterValid: { type: Number, default: 0, max: 10 },
      accountAge: { type: Number, default: 0, max: 10 },
      cleanRecord: { type: Number, default: 0, max: 10 },
      deviceTrust: { type: Number, default: 0, max: 10 },
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'high',
    },
    flags: [
      {
        type: { type: String },
        message: String,
        severity: { type: String, enum: ['info', 'warning', 'critical'] },
        createdAt: { type: Date, default: Date.now },
        resolved: { type: Boolean, default: false },
      },
    ],
    lastCalculated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

trustScoreSchema.index({ userId: 1 }, { unique: true });
trustScoreSchema.index({ riskLevel: 1 });
trustScoreSchema.index({ overallScore: -1 });

// Recalculate risk level from score
trustScoreSchema.methods.updateRiskLevel = function () {
  if (this.overallScore >= 80) {
    this.riskLevel = 'low';
  } else if (this.overallScore >= 50) {
    this.riskLevel = 'medium';
  } else {
    this.riskLevel = 'high';
  }
  return this.riskLevel;
};

module.exports = mongoose.model('TrustScore', trustScoreSchema);
