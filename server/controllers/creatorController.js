const { validationResult } = require('express-validator');
const CreatorService = require('../services/creatorService');
const { sendSuccess, sendError, sendValidationError } = require('../utils/responseUtils');

class CreatorController {
  // Helper to emit socket events
  static emitRealtimeEvent(req, room, eventName, data) {
    const io = req.app.get('io');
    if (io) {
      io.to(room).emit(eventName, data);
    }
  }

  // --- Projects ---
  static async publishProject(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendValidationError(res, errors.array());

      const { project, quality } = await CreatorService.publishProject(req.user.id, req.body);

      // Award points & track activity
      try {
        const pointsService = require('../services/pointsService');
        const PulseAnalyticsService = require('../services/pulseAnalyticsService');
        await pointsService.awardPoints(req.user.id, 'project_posted', project._id);
        await PulseAnalyticsService.trackActivity(req.user.id, 'project_uploaded', { projectId: project._id });
      } catch (err) {
        console.error('Failed to integrate gamification/analytics on project publishing:', err.message);
      }

      // Real-time notification of new project publishing
      CreatorController.emitRealtimeEvent(req, 'global', 'project_published', {
        projectId: project._id,
        title: project.title,
        userId: req.user.id,
      });

      return sendSuccess(res, {
        statusCode: 201,
        message: 'Project showcase published successfully',
        data: { project, qualityScore: quality.qualityScore, evaluation: quality },
      });
    } catch (error) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
  }

  static async getProjectDetails(req, res, next) {
    try {
      const { projectId } = req.params;
      const project = await CreatorService.getProjectDetails(projectId);
      if (!project) return sendError(res, { statusCode: 404, message: 'Project not found' });

      return sendSuccess(res, {
        message: 'Project details retrieved successfully',
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }

  static async listProjects(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const filters = {
        userId: req.query.userId,
        category: req.query.category,
        status: req.query.status,
        techStack: req.query.techStack ? req.query.techStack.split(',') : null,
        minQualityScore: req.query.minQualityScore ? parseInt(req.query.minQualityScore, 10) : 0,
        search: req.query.search,
      };

      const result = await CreatorService.listProjects(filters, page, limit);
      return sendSuccess(res, {
        message: 'Projects list retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // --- Content Posts ---
  static async publishContentPost(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendValidationError(res, errors.array());

      const post = await CreatorService.publishContentPost(req.user.id, req.body);

      // Award points & track activity
      try {
        const pointsService = require('../services/pointsService');
        const PulseAnalyticsService = require('../services/pulseAnalyticsService');
        await pointsService.awardPoints(req.user.id, 'community_participation', post._id);
        await PulseAnalyticsService.trackActivity(req.user.id, 'post_created', { postId: post._id });
      } catch (err) {
        console.error('Failed to integrate gamification/analytics on content publishing:', err.message);
      }

      // Real-time notifications of new posts
      CreatorController.emitRealtimeEvent(req, 'global', 'content_published', {
        postId: post._id,
        title: post.title,
        type: post.type,
      });

      return sendSuccess(res, {
        statusCode: 201,
        message: 'Content post published successfully',
        data: post,
      });
    } catch (error) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
  }

  static async getContentPost(req, res, next) {
    try {
      const { postId } = req.params;
      const post = await CreatorService.getContentPost(postId);
      if (!post) return sendError(res, { statusCode: 404, message: 'Post not found' });

      return sendSuccess(res, {
        message: 'Post retrieved successfully',
        data: post,
      });
    } catch (error) {
      next(error);
    }
  }

  static async listContentPosts(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const filters = {
        authorId: req.query.authorId,
        type: req.query.type,
        category: req.query.category,
        status: req.query.status,
        tag: req.query.tag,
        search: req.query.search,
      };

      const result = await CreatorService.listContentPosts(filters, page, limit);
      return sendSuccess(res, {
        message: 'Posts retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // --- AI Assistant Helper ---
  static getAIAssistantSuggestions(req, res, next) {
    try {
      const { title, content, type } = req.body;
      if (!content) return sendError(res, { statusCode: 400, message: 'Content is required' });

      const suggestions = CreatorService.getWritingAssistantTips(title || '', content, type || 'blog');
      return sendSuccess(res, {
        message: 'AI writing assistance suggestions generated',
        data: suggestions,
      });
    } catch (error) {
      next(error);
    }
  }

  // --- Resources ---
  static async uploadResource(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendValidationError(res, errors.array());

      const resource = await CreatorService.uploadResource(req.user.id, req.body);

      // Award points & track activity
      try {
        const pointsService = require('../services/pointsService');
        const PulseAnalyticsService = require('../services/pulseAnalyticsService');
        await pointsService.awardPoints(req.user.id, 'community_participation', resource._id);
        await PulseAnalyticsService.trackActivity(req.user.id, 'resource_shared', { resourceId: resource._id });
      } catch (err) {
        console.error('Failed to integrate gamification/analytics on resource upload:', err.message);
      }

      return sendSuccess(res, {
        statusCode: 201,
        message: 'Study resource uploaded successfully',
        data: resource,
      });
    } catch (error) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
  }

  static async downloadResource(req, res, next) {
    try {
      const { resourceId } = req.params;
      const resource = await CreatorService.downloadResource(resourceId);
      if (!resource) return sendError(res, { statusCode: 404, message: 'Resource not found' });

      return sendSuccess(res, {
        message: 'Resource download tracked successfully',
        data: { url: resource.url },
      });
    } catch (error) {
      next(error);
    }
  }

  static async listResources(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const filters = {
        type: req.query.type,
        category: req.query.category,
        uploadedBy: req.query.uploadedBy,
        search: req.query.search,
      };

      const result = await CreatorService.listResources(filters, page, limit);
      return sendSuccess(res, {
        message: 'Study resources retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // --- Engagement tracking ---
  static async trackPostMetrics(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendValidationError(res, errors.array());

      const { postId, views, clicks, readingDurationMs, scrollDepthPercent, hover, hoverDurationMs } = req.body;
      const analytics = await CreatorService.trackPostHoverAndMetrics(postId, {
        views,
        clicks,
        readingDurationMs,
        scrollDepthPercent,
        hover,
        hoverDurationMs,
      });

      return sendSuccess(res, {
        message: 'Hover and engagement metrics updated successfully',
        data: analytics,
      });
    } catch (error) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
  }

  static async likePost(req, res, next) {
    try {
      const { postId } = req.params;
      const post = await CreatorService.incrementPostLike(postId);
      return sendSuccess(res, {
        message: 'Liked post successfully',
        data: { likesCount: post.likesCount },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getDashboard(req, res, next) {
    try {
      const dashboard = await CreatorService.getCreatorDashboard(req.user.id);
      return sendSuccess(res, {
        message: 'Creator analytics dashboard retrieved successfully',
        data: dashboard,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPostAnalyticsDetails(req, res, next) {
    try {
      const { postId } = req.params;
      const analytics = await CreatorService.getPostAnalyticsDetails(postId);
      return sendSuccess(res, {
        message: 'Detailed post analytics retrieved successfully',
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CreatorController;
