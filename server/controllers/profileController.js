const User = require('../models/User');
const Profile = require('../models/Profile');
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

      // Include avatarUrl from Profile so AuthContext/Navbar can display it
      const profile = await Profile.findOne({ userId: req.user.id });

      return sendSuccess(res, {
        message: 'Profile retrieved',
        data: { user: { ...user.toProfile(), avatarUrl: profile?.avatarUrl || '' } },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProfileController;
