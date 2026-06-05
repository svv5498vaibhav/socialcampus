const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/responseUtils');

class ProfileController {
  /**
   * GET /api/profile
   */
  static async getProfile(req, res, next) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return sendError(res, { statusCode: 404, message: 'User not found' });
      }

      return sendSuccess(res, {
        message: 'Profile retrieved',
        data: { user: user.toProfile() },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProfileController;
