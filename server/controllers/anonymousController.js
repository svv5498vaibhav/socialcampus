const { validationResult } = require('express-validator');
const AnonymousService = require('../services/anonymousService');
const AnonymousPostRepository = require('../repositories/anonymousPostRepository');
const ReportRepository = require('../repositories/reportRepository');
const ModerationRepository = require('../repositories/moderationRepository');
const CommunityHealthMetrics = require('../models/CommunityHealthMetrics');
const AnonymousPost = require('../models/AnonymousPost');
const Report = require('../models/Report');
const Escalation = require('../models/Escalation');
const CommunityHealthEngine = require('../services/communityHealthEngine');

const { sendSuccess, sendError, sendValidationError } = require('../utils/responseUtils');

class AnonymousController {
  /**
   * POST /api/anonymous/post
   */
  static async createPost(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array());
      }

      const { content, type } = req.body;
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

      const post = await AnonymousService.createPost(req.user.id, content, type, ipAddress);

      return sendSuccess(res, {
        statusCode: 201,
        message: 'Post submitted successfully and passed AI moderation checks',
        data: {
          postId: post._id,
          category: post.category,
          sentiment: post.sentiment,
          priority: post.priority,
          moderationStatus: post.moderationStatus,
        },
      });
    } catch (error) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
  }

  /**
   * GET /api/anonymous/feed
   */
  static async getFeed(req, res, next) {
    try {
      const category = req.query.category;
      const type = req.query.type;
      const sort = req.query.sort || 'newest';
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;

      const result = await AnonymousPostRepository.findFeed({ category, type, sort, page, limit });

      return sendSuccess(res, {
        message: 'Anonymous feed retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/anonymous/report
   */
  static async reportPost(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array());
      }

      const { postId, reason, details } = req.body;
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

      const report = await AnonymousService.reportPost(req.user.id, postId, reason, details, ipAddress);

      return sendSuccess(res, {
        statusCode: 201,
        message: 'Report submitted successfully',
        data: {
          reportId: report._id,
          status: report.status,
        },
      });
    } catch (error) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
  }

  /**
   * GET /api/anonymous/trending
   */
  static async getTrendingTopics(req, res, next) {
    try {
      const days = parseInt(req.query.days, 10) || 7;
      const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const categoryDistribution = await AnonymousPostRepository.getCategoryDistribution(sinceDate);

      return sendSuccess(res, {
        message: 'Trending categories retrieved successfully',
        data: categoryDistribution,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/anonymous/categories
   */
  static async getCategories(req, res, next) {
    try {
      const categories = [
        'infrastructure',
        'academics',
        'faculty',
        'events',
        'placement',
        'hostel',
        'library',
        'labs',
        'administration',
        'general',
      ];
      return sendSuccess(res, {
        message: 'Supported feedback categories retrieved successfully',
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/anonymous/sentiment
   */
  static async getSentimentAnalysis(req, res, next) {
    try {
      const sentimentStats = await AnonymousPostRepository.getSentimentByCategories();
      return sendSuccess(res, {
        message: 'Sentiment statistics by category retrieved successfully',
        data: sentimentStats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/anonymous/community-health
   */
  static async getCommunityHealth(req, res, next) {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      let metrics = await ModerationRepository.getCommunityHealth(todayStr);

      if (!metrics) {
        // Trigger calculation if metrics record is not generated yet for today
        metrics = await CommunityHealthEngine.calculateHealthScore(todayStr);
      }

      return sendSuccess(res, {
        message: 'Community health metrics retrieved successfully',
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/anonymous/analytics (Admin Only Dashboard Summary)
   */
  static async getAnalytics(req, res, next) {
    try {
      const [totalCount, blockedCount, reportedCount, pendingEscalationsCount] = await Promise.all([
        AnonymousPost.countDocuments({}),
        AnonymousPost.countDocuments({ moderationStatus: 'blocked' }),
        Report.countDocuments({ status: 'open' }),
        Escalation.countDocuments({ status: 'pending' }),
      ]);

      const categoryDistribution = await AnonymousPostRepository.getCategoryDistribution(null);
      const sentimentDistribution = await AnonymousPostRepository.getSentimentByCategories();

      return sendSuccess(res, {
        message: 'System moderation and safety analytics summary retrieved successfully',
        data: {
          totalPosts: totalCount,
          blockedPosts: blockedCount,
          openReports: reportedCount,
          pendingEscalations: pendingEscalationsCount,
          categoryDistribution,
          sentimentDistribution,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // ── Admin Actions ──

  /**
   * POST /api/anonymous/admin/moderate
   */
  static async moderatePost(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array());
      }

      const { postId, status, reason } = req.body;
      const post = await AnonymousService.moderatePost(postId, req.user.id, status, reason);

      return sendSuccess(res, {
        message: `Post successfully marked as ${status} by admin`,
        data: post,
      });
    } catch (error) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
  }

  /**
   * GET /api/anonymous/admin/reports
   */
  static async getOpenReports(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;

      const result = await ReportRepository.findOpenReports(page, limit);

      return sendSuccess(res, {
        message: 'Open safety reports list retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/anonymous/admin/escalations
   */
  static async getPendingEscalations(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;

      const result = await ModerationRepository.getPendingEscalations(page, limit);

      return sendSuccess(res, {
        message: 'Pending escalations list retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/anonymous/admin/escalations/resolve
   */
  static async resolveEscalation(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array());
      }

      const { escalationId, notes } = req.body;
      const escalation = await AnonymousService.resolveEscalation(escalationId, req.user.id, notes);

      return sendSuccess(res, {
        message: 'Escalation issue marked as resolved successfully',
        data: escalation,
      });
    } catch (error) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
  }
}

module.exports = AnonymousController;
