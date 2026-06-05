const User = require('../models/User');
const SecurityLog = require('../models/SecurityLog');
const TrustScoreEngine = require('../services/trustScoreService');
const auditService = require('../services/auditService');
const SessionService = require('../services/sessionService');
const { sendSuccess, sendError } = require('../utils/responseUtils');
const { USER_STATUS, SECURITY_EVENTS, SEVERITY } = require('../utils/constants');

class AdminController {
  /**
   * GET /api/admin/users
   */
  static async getUsers(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
      const skip = (page - 1) * limit;

      const filter = {};
      if (req.query.status) filter.status = req.query.status;
      if (req.query.riskLevel) filter.riskLevel = req.query.riskLevel;
      if (req.query.college) filter.college = new RegExp(req.query.college, 'i');
      if (req.query.search) {
        filter.$or = [
          { email: new RegExp(req.query.search, 'i') },
          { firstName: new RegExp(req.query.search, 'i') },
          { lastName: new RegExp(req.query.search, 'i') },
          { rollNumber: new RegExp(req.query.search, 'i') },
        ];
      }

      const [users, total] = await Promise.all([
        User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        User.countDocuments(filter),
      ]);

      return sendSuccess(res, {
        message: 'Users retrieved',
        data: {
          users,
          pagination: { total, page, limit, pages: Math.ceil(total / limit) },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/users/:id
   */
  static async getUserDetail(req, res, next) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return sendError(res, { statusCode: 404, message: 'User not found' });
      }

      const [trustScore, loginHistory] = await Promise.all([
        TrustScoreEngine.getOrRecalculate(user._id),
        auditService.getLoginHistory(user._id, 10),
      ]);

      return sendSuccess(res, {
        data: {
          user: user.toProfile(),
          trustScore,
          recentLogins: loginHistory.logs,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/users/:id/block
   */
  static async blockUser(req, res, next) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return sendError(res, { statusCode: 404, message: 'User not found' });
      }

      if (user.role === 'admin') {
        return sendError(res, { statusCode: 403, message: 'Cannot block an admin account' });
      }

      user.status = user.status === USER_STATUS.BLOCKED ? USER_STATUS.ACTIVE : USER_STATUS.BLOCKED;
      await user.save();

      // Terminate sessions if blocking
      if (user.status === USER_STATUS.BLOCKED) {
        await SessionService.deactivateAllSessions(user._id);
      }

      await auditService.logSecurityEvent({
        userId: user._id,
        eventType: user.status === USER_STATUS.BLOCKED
          ? SECURITY_EVENTS.ACCOUNT_BLOCKED
          : 'account_unblocked',
        severity: SEVERITY.HIGH,
        description: `Account ${user.status === USER_STATUS.BLOCKED ? 'blocked' : 'unblocked'} by admin ${req.user.email}`,
        metadata: { adminId: req.user.id },
      });

      return sendSuccess(res, {
        message: `User ${user.status === USER_STATUS.BLOCKED ? 'blocked' : 'unblocked'} successfully`,
        data: { status: user.status },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/users/:id/suspend
   */
  static async suspendUser(req, res, next) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return sendError(res, { statusCode: 404, message: 'User not found' });
      }

      if (user.role === 'admin') {
        return sendError(res, { statusCode: 403, message: 'Cannot suspend an admin account' });
      }

      user.status = user.status === USER_STATUS.SUSPENDED ? USER_STATUS.ACTIVE : USER_STATUS.SUSPENDED;
      await user.save();

      await auditService.logSecurityEvent({
        userId: user._id,
        eventType: SECURITY_EVENTS.ACCOUNT_SUSPENDED,
        severity: SEVERITY.MEDIUM,
        description: `Account ${user.status === USER_STATUS.SUSPENDED ? 'suspended' : 'unsuspended'} by admin ${req.user.email}`,
        metadata: { adminId: req.user.id },
      });

      return sendSuccess(res, {
        message: `User ${user.status === USER_STATUS.SUSPENDED ? 'suspended' : 'unsuspended'} successfully`,
        data: { status: user.status },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/fraud-alerts
   */
  static async getFraudAlerts(req, res, next) {
    try {
      const result = await auditService.getSecurityLogs({
        severity: req.query.severity,
        eventType: req.query.eventType,
        resolved: req.query.resolved === 'true' ? true : req.query.resolved === 'false' ? false : undefined,
        limit: parseInt(req.query.limit, 10) || 50,
        page: parseInt(req.query.page, 10) || 1,
      });

      return sendSuccess(res, {
        message: 'Fraud alerts retrieved',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/security-logs
   */
  static async getSecurityLogs(req, res, next) {
    try {
      const result = await auditService.getSecurityLogs({
        limit: parseInt(req.query.limit, 10) || 50,
        page: parseInt(req.query.page, 10) || 1,
      });

      return sendSuccess(res, {
        message: 'Security logs retrieved',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/stats
   */
  static async getDashboardStats(req, res, next) {
    try {
      const [
        totalUsers,
        activeUsers,
        pendingUsers,
        blockedUsers,
        suspendedUsers,
        highRiskUsers,
        alertCount,
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ status: 'active' }),
        User.countDocuments({ status: 'pending' }),
        User.countDocuments({ status: 'blocked' }),
        User.countDocuments({ status: 'suspended' }),
        User.countDocuments({ riskLevel: 'high' }),
        auditService.getAlertCount(),
      ]);

      return sendSuccess(res, {
        message: 'Dashboard stats retrieved',
        data: {
          users: { total: totalUsers, active: activeUsers, pending: pendingUsers, blocked: blockedUsers, suspended: suspendedUsers },
          security: { highRiskUsers, unresolvedAlerts: alertCount },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/profile-analytics
   */
  static async getProfileAnalytics(req, res, next) {
    try {
      const Profile = require('../models/Profile');
      const [
        totalProfiles,
        onboardingCompleted,
        levelDistribution,
        avgScore,
      ] = await Promise.all([
        Profile.countDocuments(),
        Profile.countDocuments({ onboardingCompleted: true }),
        Profile.aggregate([
          { $group: { _id: '$profileLevel', count: { $sum: 1 } } },
        ]),
        Profile.aggregate([
          { $group: { _id: null, avg: { $avg: '$profileCompletionScore' } } },
        ]),
      ]);

      return sendSuccess(res, {
        message: 'Profile analytics retrieved',
        data: {
          totalProfiles,
          onboardingCompleted,
          completionRate: totalProfiles > 0 ? Math.round((onboardingCompleted / totalProfiles) * 100) : 0,
          averageScore: avgScore[0]?.avg ? Math.round(avgScore[0].avg) : 0,
          levelDistribution: levelDistribution.reduce((acc, item) => {
            acc[item._id || 'unknown'] = item.count;
            return acc;
          }, {}),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/skill-trends
   */
  static async getSkillTrends(req, res, next) {
    try {
      const Profile = require('../models/Profile');
      const skillTrends = await Profile.aggregate([
        { $unwind: '$skills' },
        { $group: { _id: '$skills', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 30 },
      ]);

      return sendSuccess(res, {
        message: 'Skill trends retrieved',
        data: { trends: skillTrends.map((s) => ({ skill: s._id, count: s.count })) },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/interest-trends
   */
  static async getInterestTrends(req, res, next) {
    try {
      const Profile = require('../models/Profile');
      const interestTrends = await Profile.aggregate([
        { $unwind: '$interests' },
        { $group: { _id: '$interests', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 30 },
      ]);

      return sendSuccess(res, {
        message: 'Interest trends retrieved',
        data: { trends: interestTrends.map((i) => ({ interest: i._id, count: i.count })) },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/feed/reports
   */
  static async getReportedPosts(req, res, next) {
    try {
      const Post = require('../models/Post');
      const page = parseInt(req.query.page, 10) || 1;
      const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
      const skip = (page - 1) * limit;

      const [posts, total] = await Promise.all([
        Post.find({ isReported: true })
          .populate('authorId', 'firstName lastName email college branch')
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Post.countDocuments({ isReported: true })
      ]);

      return sendSuccess(res, {
        message: 'Reported posts retrieved',
        data: {
          posts,
          pagination: { total, page, limit, pages: Math.ceil(total / limit) }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/admin/feed/posts/:postId
   */
  static async deletePost(req, res, next) {
    try {
      const Post = require('../models/Post');
      const { postId } = req.params;

      const post = await Post.findByIdAndDelete(postId);
      if (!post) {
        return sendError(res, { statusCode: 404, message: 'Post not found' });
      }

      // Also clean up likes/comments/saves/shares/views associated with it
      const Like = require('../models/Like');
      const Comment = require('../models/Comment');
      const Save = require('../models/Save');
      const Share = require('../models/Share');
      const View = require('../models/View');
      const FeedScore = require('../models/FeedScore');
      const TrendingData = require('../models/TrendingData');

      await Promise.all([
        Like.deleteMany({ postId }),
        Comment.deleteMany({ postId }),
        Save.deleteMany({ postId }),
        Share.deleteMany({ postId }),
        View.deleteMany({ postId }),
        FeedScore.deleteMany({ postId }),
        TrendingData.deleteMany({ postId })
      ]);

      return sendSuccess(res, {
        message: 'Post and associated engagement data deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/feed/posts/:postId/dismiss
   */
  static async dismissReport(req, res, next) {
    try {
      const Post = require('../models/Post');
      const { postId } = req.params;

      const post = await Post.findById(postId);
      if (!post) {
        return sendError(res, { statusCode: 404, message: 'Post not found' });
      }

      post.isReported = false;
      post.reports = [];
      await post.save();

      return sendSuccess(res, {
        message: 'Reports dismissed successfully',
        data: post
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/feed/spam
   */
  static async getSpamAlerts(req, res, next) {
    try {
      const Post = require('../models/Post');
      const page = parseInt(req.query.page, 10) || 1;
      const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
      const skip = (page - 1) * limit;

      const [posts, total] = await Promise.all([
        Post.find({ $or: [{ isSpam: true }, { spamScore: { $gte: 40 } }] })
          .populate('authorId', 'firstName lastName email college')
          .sort({ spamScore: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Post.countDocuments({ $or: [{ isSpam: true }, { spamScore: { $gte: 40 } }] })
      ]);

      return sendSuccess(res, {
        message: 'Spam alerts retrieved',
        data: {
          posts,
          pagination: { total, page, limit, pages: Math.ceil(total / limit) }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/feed/performance
   */
  static async getFeedPerformance(req, res, next) {
    try {
      const Post = require('../models/Post');
      const Like = require('../models/Like');
      const Comment = require('../models/Comment');
      const Save = require('../models/Save');
      const Share = require('../models/Share');
      const View = require('../models/View');

      const [
        totalPosts,
        totalLikes,
        totalComments,
        totalSaves,
        totalShares,
        totalViews,
        totalSpam,
        totalReported
      ] = await Promise.all([
        Post.countDocuments({}),
        Like.countDocuments({}),
        Comment.countDocuments({}),
        Save.countDocuments({}),
        Share.countDocuments({}),
        View.countDocuments({}),
        Post.countDocuments({ isSpam: true }),
        Post.countDocuments({ isReported: true })
      ]);

      // Calculate post type breakdown
      const typeBreakdown = await Post.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]);

      return sendSuccess(res, {
        message: 'Feed performance metrics compiled',
        data: {
          metrics: {
            totalPosts,
            totalLikes,
            totalComments,
            totalSaves,
            totalShares,
            totalViews,
            totalSpam,
            totalReported,
            engagementRate: totalViews > 0 ? Math.round(((totalLikes + totalComments + totalSaves + totalShares) / totalViews) * 100 * 10) / 10 : 0
          },
          postTypes: typeBreakdown.map(t => ({ type: t._id, count: t.count }))
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AdminController;
