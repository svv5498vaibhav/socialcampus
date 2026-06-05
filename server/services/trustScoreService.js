const TrustScore = require('../models/TrustScore');
const VerificationRecord = require('../models/VerificationRecord');
const SecurityLog = require('../models/SecurityLog');
const Device = require('../models/Device');
const User = require('../models/User');
const { TRUST_WEIGHTS, ACCOUNT_AGE_THRESHOLD } = require('../utils/constants');

/**
 * Trust Score Engine
 *
 * Calculates a 0–100 trust score based on 7 verification factors.
 * Updates the user's risk level accordingly.
 */
class TrustScoreEngine {
  /**
   * Calculate or recalculate trust score for a user
   */
  static async calculateTrustScore(userId) {
    const [user, verification, securityFlags, devices] = await Promise.all([
      User.findById(userId),
      VerificationRecord.findOne({ userId }),
      SecurityLog.countDocuments({
        userId,
        resolved: false,
        severity: { $in: ['high', 'critical'] },
      }),
      Device.find({ userId }),
    ]);

    if (!user) throw new Error('User not found');

    const breakdown = {
      emailVerified: 0,
      rollNumberValid: 0,
      branchMatched: 0,
      semesterValid: 0,
      accountAge: 0,
      cleanRecord: 0,
      deviceTrust: 0,
    };

    const flags = [];

    // Factor 1: Email Verified (25 points)
    if (user.emailVerified) {
      breakdown.emailVerified = TRUST_WEIGHTS.EMAIL_VERIFIED;
    } else {
      flags.push({
        type: 'email_not_verified',
        message: 'Email address has not been verified',
        severity: 'warning',
      });
    }

    // Factor 2: Roll Number Valid (20 points)
    if (verification && verification.rollNumberVerification === 'verified') {
      breakdown.rollNumberValid = TRUST_WEIGHTS.ROLL_NUMBER_VALID;
    } else if (verification && verification.rollNumberVerification === 'failed') {
      flags.push({
        type: 'roll_number_invalid',
        message: 'Roll number verification failed',
        severity: 'warning',
      });
    }

    // Factor 3: Branch Matched (15 points)
    if (verification && verification.branchVerification === 'verified') {
      breakdown.branchMatched = TRUST_WEIGHTS.BRANCH_MATCHED;
    }

    // Factor 4: Semester Valid (10 points)
    if (verification && verification.semesterVerification === 'verified') {
      breakdown.semesterValid = TRUST_WEIGHTS.SEMESTER_VALID;
    }

    // Factor 5: Account Age (10 points)
    const accountAgeDays = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (accountAgeDays >= ACCOUNT_AGE_THRESHOLD) {
      breakdown.accountAge = TRUST_WEIGHTS.ACCOUNT_AGE;
    } else {
      // Proportional score
      breakdown.accountAge = Math.floor(
        (accountAgeDays / ACCOUNT_AGE_THRESHOLD) * TRUST_WEIGHTS.ACCOUNT_AGE
      );
    }

    // Factor 6: Clean Security Record (10 points)
    if (securityFlags === 0) {
      breakdown.cleanRecord = TRUST_WEIGHTS.CLEAN_RECORD;
    } else if (securityFlags <= 2) {
      breakdown.cleanRecord = Math.floor(TRUST_WEIGHTS.CLEAN_RECORD / 2);
    } else {
      flags.push({
        type: 'security_flags',
        message: `${securityFlags} unresolved security flags on account`,
        severity: 'critical',
      });
    }

    // Factor 7: Device Trust (10 points)
    const trustedDevices = devices.filter((d) => d.trusted).length;
    if (trustedDevices >= 1) {
      breakdown.deviceTrust = Math.min(trustedDevices * 5, TRUST_WEIGHTS.DEVICE_TRUST);
    }

    // Calculate overall score
    const overallScore = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

    // Upsert trust score record
    const trustScore = await TrustScore.findOneAndUpdate(
      { userId },
      {
        userId,
        overallScore,
        breakdown,
        flags,
        lastCalculated: new Date(),
      },
      { upsert: true, new: true }
    );

    // Update risk level
    trustScore.updateRiskLevel();
    await trustScore.save();

    // Sync risk level to user
    await User.findByIdAndUpdate(userId, { riskLevel: trustScore.riskLevel });

    return trustScore;
  }

  /**
   * Get trust score for a user
   */
  static async getTrustScore(userId) {
    let score = await TrustScore.findOne({ userId });
    if (!score) {
      score = await this.calculateTrustScore(userId);
    }
    return score;
  }

  /**
   * Recalculate trust score if stale (older than 1 hour)
   */
  static async getOrRecalculate(userId) {
    const score = await TrustScore.findOne({ userId });
    if (!score) {
      return this.calculateTrustScore(userId);
    }

    const ageMs = Date.now() - new Date(score.lastCalculated).getTime();
    if (ageMs > 60 * 60 * 1000) {
      return this.calculateTrustScore(userId);
    }

    return score;
  }
}

module.exports = TrustScoreEngine;
