const SessionService = require('../services/sessionService');
const { sendSuccess, sendError } = require('../utils/responseUtils');

class SessionController {
  /**
   * GET /api/security/sessions
   */
  static async getActiveSessions(req, res, next) {
    try {
      const sessions = await SessionService.getActiveSessions(req.user.id);

      return sendSuccess(res, {
        message: 'Active sessions retrieved',
        data: { sessions, count: sessions.length },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/security/sessions/:id
   */
  static async revokeSession(req, res, next) {
    try {
      const session = await SessionService.deactivateSession(
        req.params.id,
        req.user.id
      );

      if (!session) {
        return sendError(res, { statusCode: 404, message: 'Session not found' });
      }

      return sendSuccess(res, {
        message: 'Session revoked successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SessionController;
