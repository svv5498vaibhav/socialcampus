const VerificationRecord = require('../models/VerificationRecord');
const User = require('../models/User');
const collegeService = require('./collegeService');
const TrustScoreEngine = require('./trustScoreService');
const auditService = require('./auditService');
const { VERIFICATION_STATUS, SECURITY_EVENTS, SEVERITY } = require('../utils/constants');

/**
 * Auto Verification Engine
 *
 * Automatically verifies student details:
 * - College email domain
 * - Roll number format
 * - Branch availability
 * - Semester range
 */
class VerificationService {
  /**
   * Run full auto-verification for a user
   */
  static async runAutoVerification(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    let record = await VerificationRecord.findOne({ userId });
    if (!record) {
      record = new VerificationRecord({ userId });
    }

    // 1. Email domain verification
    if (user.emailVerified) {
      const isValidDomain = collegeService.isValidCollegeEmail(user.email);
      record.emailVerification = isValidDomain ? 'verified' : 'failed';
      record.verificationData.emailDomain = user.email.split('@')[1];
      record.verificationData.emailVerifiedAt = new Date();

      if (!isValidDomain) {
        await auditService.logSecurityEvent({
          userId,
          eventType: SECURITY_EVENTS.VERIFICATION_FAILED,
          severity: SEVERITY.MEDIUM,
          description: `Email domain not recognized: ${user.email}`,
          metadata: { email: user.email },
        });
      }
    }

    // 2. Roll number verification
    if (user.rollNumber && user.college) {
      const rollCheck = collegeService.isValidRollNumber(user.rollNumber, user.college);
      record.rollNumberVerification = rollCheck.valid ? 'verified' : 'failed';
      record.verificationData.rollNumberFormat = rollCheck.valid ? 'valid' : rollCheck.error;
      record.verificationData.rollNumberVerifiedAt = new Date();
    }

    // 3. Branch verification
    if (user.branch && user.college) {
      const branchCheck = collegeService.isValidBranch(user.branch, user.college);
      record.branchVerification = branchCheck.valid ? 'verified' : 'failed';
      record.verificationData.branchMatchedCollege = branchCheck.valid;
      record.verificationData.branchVerifiedAt = new Date();
    }

    // 4. Semester verification
    if (user.semester && user.college) {
      const semCheck = collegeService.isValidSemester(user.semester, user.college);
      record.semesterVerification = semCheck.valid ? 'verified' : 'failed';
      record.verificationData.semesterValid = semCheck.valid;
      record.verificationData.semesterVerifiedAt = new Date();
    }

    // Calculate overall status
    record.calculateOverallStatus();

    // Calculate auto-verification confidence score
    const verifiedCount = [
      record.emailVerification,
      record.rollNumberVerification,
      record.branchVerification,
      record.semesterVerification,
    ].filter((s) => s === 'verified').length;

    record.verificationData.autoVerificationScore = (verifiedCount / 4) * 100;

    // If all pass, mark user as verified
    if (record.overallStatus === 'verified') {
      await User.findByIdAndUpdate(userId, {
        isVerified: true,
        status: 'active',
      });
    }

    // If overall failed, flag for manual review
    if (record.overallStatus === 'failed') {
      record.identityVerification = 'manual_review';
      record.overallStatus = 'manual_review';
      record.verificationData.manualReviewReason = 'Auto-verification failed for one or more checks';

      await auditService.logSecurityEvent({
        userId,
        eventType: SECURITY_EVENTS.MANUAL_REVIEW,
        severity: SEVERITY.MEDIUM,
        description: `Auto-verification failed, manual review required for ${user.email}`,
        metadata: {
          email: record.emailVerification,
          rollNumber: record.rollNumberVerification,
          branch: record.branchVerification,
          semester: record.semesterVerification,
        },
      });
    }

    await record.save();

    // Recalculate trust score
    await TrustScoreEngine.calculateTrustScore(userId);

    return record;
  }

  /**
   * Get verification status for a user
   */
  static async getVerificationStatus(userId) {
    const record = await VerificationRecord.findOne({ userId });
    if (!record) {
      return {
        overallStatus: 'pending',
        details: 'No verification has been performed yet',
      };
    }
    return record;
  }

  /**
   * Mark email as verified after OTP confirmation
   */
  static async markEmailVerified(userId) {
    await User.findByIdAndUpdate(userId, { emailVerified: true });

    let record = await VerificationRecord.findOne({ userId });
    if (!record) {
      record = new VerificationRecord({ userId });
    }

    record.emailVerification = 'verified';
    record.verificationData.emailVerifiedAt = new Date();
    record.calculateOverallStatus();
    await record.save();

    // Re-run full auto verification
    return this.runAutoVerification(userId);
  }
}

module.exports = VerificationService;
