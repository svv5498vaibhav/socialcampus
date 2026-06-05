const TrustScoreEngine = require('./trustScoreService');

/**
 * Risk Analysis Engine
 *
 * Provides risk-based access control and recommendations
 * based on the user's trust score and activity patterns.
 */
class RiskAnalysisEngine {
  /**
   * Assess risk level for a user
   * Returns detailed risk analysis with recommendations
   */
  static async assessRisk(userId) {
    const trustScore = await TrustScoreEngine.getOrRecalculate(userId);

    const analysis = {
      userId,
      trustScore: trustScore.overallScore,
      riskLevel: trustScore.riskLevel,
      breakdown: trustScore.breakdown,
      flags: trustScore.flags.filter((f) => !f.resolved),
      recommendations: [],
      accessLevel: 'full',
      requiresAction: false,
    };

    // Generate recommendations based on breakdown
    if (trustScore.breakdown.emailVerified === 0) {
      analysis.recommendations.push({
        action: 'verify_email',
        priority: 'high',
        message: 'Verify your college email to increase trust score by 25 points',
        impact: 25,
      });
      analysis.requiresAction = true;
    }

    if (trustScore.breakdown.rollNumberValid === 0) {
      analysis.recommendations.push({
        action: 'verify_roll_number',
        priority: 'high',
        message: 'Your roll number needs verification (+20 points)',
        impact: 20,
      });
    }

    if (trustScore.breakdown.branchMatched === 0) {
      analysis.recommendations.push({
        action: 'verify_branch',
        priority: 'medium',
        message: 'Branch verification pending (+15 points)',
        impact: 15,
      });
    }

    if (trustScore.breakdown.deviceTrust < 10) {
      analysis.recommendations.push({
        action: 'trust_device',
        priority: 'low',
        message: 'Mark your devices as trusted for additional trust score',
        impact: 10 - trustScore.breakdown.deviceTrust,
      });
    }

    // Determine access level based on risk
    switch (trustScore.riskLevel) {
      case 'low':
        analysis.accessLevel = 'full';
        break;
      case 'medium':
        analysis.accessLevel = 'limited';
        analysis.restrictions = [
          'Cannot create communities',
          'Limited messaging (10/day)',
          'Periodic re-verification may be required',
        ];
        break;
      case 'high':
        analysis.accessLevel = 'restricted';
        analysis.restrictions = [
          'Read-only access to communities',
          'No messaging',
          'No event creation',
          'Manual review required for full access',
        ];
        analysis.requiresAction = true;
        break;
    }

    return analysis;
  }

  /**
   * Quick risk check — returns risk level string
   */
  static async quickRiskCheck(userId) {
    const trustScore = await TrustScoreEngine.getOrRecalculate(userId);
    return {
      riskLevel: trustScore.riskLevel,
      score: trustScore.overallScore,
    };
  }

  /**
   * Batch risk assessment for admin dashboard
   */
  static async batchAssessment(userIds) {
    const results = await Promise.all(
      userIds.map(async (userId) => {
        try {
          const risk = await this.quickRiskCheck(userId);
          return { userId, ...risk };
        } catch {
          return { userId, riskLevel: 'unknown', score: 0 };
        }
      })
    );
    return results;
  }
}

module.exports = RiskAnalysisEngine;
