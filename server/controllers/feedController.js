const { validationResult } = require('express-validator');
const FeedService = require('../services/feedService');
const AnalyticsService = require('../services/analyticsService');
const RecommendationEngine = require('../services/recommendationEngine');
const OpportunityEngine = require('../services/opportunityEngine');
const Post = require('../models/Post');
const Profile = require('../models/Profile');
const { sendSuccess, sendError, sendValidationError } = require('../utils/responseUtils');
const User = require('../models/User');
const { logActivity, createAndSendNotification } = require('../services/socketService');

class FeedController {
  /**
   * POST /api/feed/posts
   */
  static async createPost(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array());
      }

      const post = await FeedService.createPost(req.user.id, req.body, req.user.role);

      // Award points & check achievements/badges if post is not spam
      if (post && !post.isSpam) {
        try {
          const pointsService = require('../services/pointsService');
          const badgeService = require('../services/badgeService');
          const achievementService = require('../services/achievementService');

          const actionType = post.type === 'project' ? 'project_posted' : 'community_participation';
          await pointsService.awardPoints(req.user.id, actionType, post._id);
          
          // Evaluate achievements & badges
          await badgeService.checkBadges(req.user.id, 'post', post.type);
          await achievementService.checkAndUnlock(req.user.id, 'post_count');
          if (post.type === 'project') {
            await achievementService.checkAndUnlock(req.user.id, 'project_count');
          }
        } catch (gamifyErr) {
          console.error('Failed to update gamification on post creation:', gamifyErr.message);
        }
      }

      return sendSuccess(res, {
        statusCode: 210, // Standard CampusX custom code or 201
        message: 'Post published successfully',
        data: post
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/feed/for-you
   * GET /api/feed/following
   * GET /api/feed/branch
   * GET /api/feed/trending
   * GET /api/feed/projects
   * GET /api/feed/internships
   * GET /api/feed/events
   */
  static async getFeedTab(req, res, next) {
    try {
      const tab = req.params.tab || 'for-you';
      const page = parseInt(req.query.page, 10) || 1;
      const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);

      const feedData = await FeedService.getFeed(req.user.id, tab, page, limit);

      return sendSuccess(res, {
        message: `${tab} feed retrieved`,
        data: feedData
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/feed/like
   */
  static async toggleLike(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array());
      }

      const { postId } = req.body;
      const result = await FeedService.toggleLike(postId, req.user.id);

      // Award points & reputation to author if liked and not skipped
      if (!req.skipGamification) {
        const postObj = await Post.findById(postId).select('authorId').lean();
        if (postObj) {
          try {
            const pointsService = require('../services/pointsService');
            const reputationService = require('../services/reputationService');
            const achievementService = require('../services/achievementService');

            if (result.isLiked) {
              await pointsService.awardPoints(postObj.authorId, 'project_liked', postId, { likerId: req.user.id });
              await reputationService.updateReputation(postObj.authorId, 'project_liked', postId, { likerId: req.user.id });
              await achievementService.checkAndUnlock(postObj.authorId, 'like_count');
            } else {
              // Rollback points on unlike
              const PointsLog = require('../models/PointsLog');
              const log = await PointsLog.findOne({
                userId: postObj.authorId,
                actionType: 'project_liked',
                sourceId: postId,
                'metadata.likerId': req.user.id
              });
              if (log) {
                const UserPoint = require('../models/UserPoint');
                await UserPoint.findOneAndUpdate(
                  { userId: postObj.authorId },
                  { $inc: { currentPoints: -log.pointsEarned, lifetimePoints: -log.pointsEarned } }
                );
                await PointsLog.deleteOne({ _id: log._id });
              }
              // Deduct reputation
              await reputationService.updateReputation(postObj.authorId, 'admin_adjustment', postId, { 
                change: -10, 
                reason: 'unlike_deduction' 
              });
            }
          } catch (gamifyErr) {
            console.error('Failed to update gamification on toggleLike:', gamifyErr.message);
          }
        }
      }

      return sendSuccess(res, {
        message: result.isLiked ? 'Post liked' : 'Post unliked',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/feed/comment
   */
  static async addComment(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array());
      }

      const { postId, content } = req.body;
      const result = await FeedService.addComment(postId, req.user.id, content);

      // Award points & evaluate badge milestones for comments
      if (result.comment && !req.skipGamification) {
        try {
          const pointsService = require('../services/pointsService');
          const badgeService = require('../services/badgeService');

          await pointsService.awardPoints(req.user.id, 'comment_added', result.comment._id);
          await badgeService.checkBadges(req.user.id, 'comment');
        } catch (gamifyErr) {
          console.error('Failed to update gamification on comment creation:', gamifyErr.message);
        }
      }

      return sendSuccess(res, {
        message: 'Comment added successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/feed/posts/:postId/comments
   */
  static async getComments(req, res, next) {
    try {
      const { postId } = req.params;
      const page = parseInt(req.query.page, 10) || 1;
      const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);

      const comments = await FeedService.getComments(postId, page, limit);

      return sendSuccess(res, {
        message: 'Comments retrieved',
        data: comments
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/feed/save
   */
  static async toggleSave(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array());
      }

      const { postId } = req.body;
      const result = await FeedService.toggleSave(postId, req.user.id);

      // Award points & reputation to author if bookmarked and not skipped
      if (!req.skipGamification) {
        const postObj = await Post.findById(postId).select('authorId').lean();
        if (postObj) {
          try {
            const pointsService = require('../services/pointsService');
            const reputationService = require('../services/reputationService');

            if (result.isSaved) {
              await pointsService.awardPoints(postObj.authorId, 'project_saved', postId, { saverId: req.user.id });
              await reputationService.updateReputation(postObj.authorId, 'project_saved', postId, { saverId: req.user.id });
            } else {
              // Rollback points on unsave
              const PointsLog = require('../models/PointsLog');
              const log = await PointsLog.findOne({
                userId: postObj.authorId,
                actionType: 'project_saved',
                sourceId: postId,
                'metadata.saverId': req.user.id
              });
              if (log) {
                const UserPoint = require('../models/UserPoint');
                await UserPoint.findOneAndUpdate(
                  { userId: postObj.authorId },
                  { $inc: { currentPoints: -log.pointsEarned, lifetimePoints: -log.pointsEarned } }
                );
                await PointsLog.deleteOne({ _id: log._id });
              }
              // Deduct reputation
              await reputationService.updateReputation(postObj.authorId, 'admin_adjustment', postId, { 
                change: -5, 
                reason: 'unsave_deduction' 
              });
            }
          } catch (gamifyErr) {
            console.error('Failed to update gamification on toggleSave:', gamifyErr.message);
          }
        }
      }

      return sendSuccess(res, {
        message: result.isSaved ? 'Post bookmarked' : 'Bookmark removed',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/feed/share
   */
  static async registerShare(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array());
      }

      const { postId, platform } = req.body;
      const result = await FeedService.registerShare(postId, req.user.id, platform);

      return sendSuccess(res, {
        message: 'Share logged successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/feed/view
   */
  static async trackView(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array());
      }

      const { postId, watchTime } = req.body;
      await AnalyticsService.trackView(postId, req.user.id, watchTime || 0);

      return sendSuccess(res, {
        message: 'View tracked'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/feed/recommendations
   */
  static async getRecommendations(req, res, next) {
    try {
      const recommendations = await RecommendationEngine.recommendForUser(req.user.id);

      return sendSuccess(res, {
        message: 'Recommendations generated successfully',
        data: recommendations
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/feed/opportunities
   */
  static async getOpportunities(req, res, next) {
    try {
      const opportunities = await OpportunityEngine.recommendOpportunities(req.user.id);

      return sendSuccess(res, {
        message: 'Opportunities recommended successfully',
        data: opportunities
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/feed/creator-analytics
   */
  static async getCreatorAnalytics(req, res, next) {
    try {
      const stats = await AnalyticsService.getCreatorAnalytics(req.user.id);

      return sendSuccess(res, {
        message: 'Creator analytics retrieved successfully',
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/feed/report
   */
  static async reportPost(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array());
      }

      const { postId, reason } = req.body;

      const post = await Post.findById(postId);
      if (!post) {
        return sendError(res, { statusCode: 404, message: 'Post not found' });
      }

      // Check if user already reported
      const alreadyReported = post.reports.some(r => r.userId.toString() === req.user.id);
      if (alreadyReported) {
        return sendError(res, { statusCode: 400, message: 'You have already reported this post' });
      }

      post.reports.push({
        userId: req.user.id,
        reason
      });
      post.isReported = true;
      await post.save();

      return sendSuccess(res, {
        message: 'Post reported to moderators. Thank you for keeping CampusX safe.'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/feed/follow/:targetUserId
   */
  static async followUser(req, res, next) {
    try {
      const { targetUserId } = req.params;
      
      if (targetUserId === req.user.id) {
        return sendError(res, { statusCode: 400, message: 'You cannot follow yourself' });
      }

      const targetUser = await User.findById(targetUserId);
      if (!targetUser) {
        return sendError(res, { statusCode: 404, message: 'User to follow not found' });
      }

      // Find profiles
      const [myProfile, targetProfile] = await Promise.all([
        Profile.findOne({ userId: req.user.id }),
        Profile.findOne({ userId: targetUserId })
      ]);

      if (!myProfile || !targetProfile) {
        return sendError(res, { statusCode: 404, message: 'User profiles not found' });
      }

      const isFollowing = myProfile.following.includes(targetUserId);

      if (isFollowing) {
        // Unfollow
        myProfile.following = myProfile.following.filter(id => id.toString() !== targetUserId);
        targetProfile.followers = targetProfile.followers.filter(id => id.toString() !== req.user.id);
        await Promise.all([myProfile.save(), targetProfile.save()]);

        return sendSuccess(res, {
          message: `Unfollowed @${targetProfile.username || targetUser.firstName}`,
          data: { isFollowing: false }
        });
      } else {
        // Follow
        myProfile.following.push(targetUserId);
        targetProfile.followers.push(req.user.id);
        await Promise.all([myProfile.save(), targetProfile.save()]);

        // Log Activity
        await logActivity(req.user.id, 'follow_user', targetUserId);

        // Send Real-Time Notification
        const user = await User.findById(req.user.id).lean();
        await createAndSendNotification(
          targetUserId,
          req.user.id,
          'follow',
          null,
          'New Follower! 👥',
          `${user.firstName} ${user.lastName} started following you.`
        );

        return sendSuccess(res, {
          message: `Following @${targetProfile.username || targetUser.firstName}`,
          data: { isFollowing: true }
        });
      }
    } catch (error) {
      next(error);
    }
  }
  /**
   * POST /api/feed/poll/vote
   */
  static async votePoll(req, res, next) {
    try {
      const { postId, optionIndex } = req.body;
      if (optionIndex === undefined || optionIndex === null) {
        return sendError(res, { statusCode: 400, message: 'optionIndex is required' });
      }

      const post = await FeedService.votePoll(postId, parseInt(optionIndex, 10), req.user.id);
      return sendSuccess(res, {
        message: 'Vote recorded',
        data: post
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/feed/notifications
   */
  static async getNotifications(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);

      const notifications = await FeedService.getNotifications(req.user.id, page, limit);

      return sendSuccess(res, {
        message: 'Notifications retrieved successfully',
        data: notifications
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/feed/notifications/unread-count
   */
  static async getUnreadNotificationCount(req, res, next) {
    try {
      const count = await FeedService.getUnreadNotificationCount(req.user.id);

      return sendSuccess(res, {
        message: 'Unread notifications count retrieved',
        data: { count }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/feed/notifications/read
   */
  static async markNotificationsAsRead(req, res, next) {
    try {
      const { notificationId } = req.body;
      const result = await FeedService.markNotificationsAsRead(req.user.id, notificationId);

      return sendSuccess(res, {
        message: notificationId ? 'Notification marked as read' : 'All notifications marked as read',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = FeedController;
