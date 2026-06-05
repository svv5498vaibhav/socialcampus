const RiskAnalysisEngine = require('../services/riskAnalysisService');
const TrustScoreEngine = require('../services/trustScoreService');
const auditService = require('../services/auditService');
const { sendSuccess } = require('../utils/responseUtils');

class SecurityController {
  /**
   * GET /api/security/status
   */
  static async getSecurityStatus(req, res, next) {
    try {
      const [riskAnalysis, loginHistory] = await Promise.all([
        RiskAnalysisEngine.assessRisk(req.user.id),
        auditService.getLoginHistory(req.user.id, 5),
      ]);

      return sendSuccess(res, {
        message: 'Security status retrieved',
        data: {
          risk: riskAnalysis,
          recentLogins: loginHistory.logs,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/security/login-history
   */
  static async getLoginHistory(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

      const history = await auditService.getLoginHistory(req.user.id, limit, page);

      return sendSuccess(res, {
        message: 'Login history retrieved',
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/security/trust-score
   */
  static async getTrustScore(req, res, next) {
    try {
      const score = await TrustScoreEngine.getOrRecalculate(req.user.id);

      return sendSuccess(res, {
        message: 'Trust score retrieved',
        data: { trustScore: score },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SecurityController;
