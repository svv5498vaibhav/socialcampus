const { validationResult } = require('express-validator');
const UserPoint = require('../models/UserPoint');
const PointsLog = require('../models/PointsLog');
const UserReputation = require('../models/UserReputation');
const Achievement = require('../models/Achievement');
const UserAchievement = require('../models/UserAchievement');
const Badge = require('../models/Badge');
const UserBadge = require('../models/UserBadge');
const RankingHistory = require('../models/RankingHistory');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const User = require('../models/User');
const RewardTransaction = require('../models/RewardTransaction');
const Reward = require('../models/Reward');
const UserReward = require('../models/UserReward');

const leaderboardService = require('../services/leaderboardService');
const pointsService = require('../services/pointsService');
const reputationService = require('../services/reputationService');
const { sendSuccess, sendError, sendValidationError } = require('../utils/responseUtils');

class GamificationController {
  /**
   * Helper to format current week key YYYY-WW
   */
  static _getWeekKey() {
    const today = new Date();
    const tempDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    const dayNum = tempDate.getUTCDay() || 7;
    tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
    const weekNum = Math.ceil((((tempDate - yearStart) / 86400000) + 1) / 7);
    return `${tempDate.getUTCFullYear()}-${weekNum}`;
  }

  /**
   * Helper to format current month key YYYY-MM
   */
  static _getMonthKey() {
    return new Date().toISOString().slice(0, 7);
  }

  /**
   * GET /api/gamification/leaderboard
   */
  static async getOverallLeaderboard(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array());
      }

      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 50;

      const leaderboard = await leaderboardService.getLeaderboard('leaderboard:overall', page, limit);
      const userRank = await leaderboardService.getUserRankInLeaderboard('leaderboard:overall', req.user.id);
      const userPoints = await UserPoint.findOne({ userId: req.user.id }).select('lifetimePoints currentPoints').lean();

      return sendSuccess(res, {
        message: 'Overall leaderboard retrieved successfully',
        data: {
          leaderboard,
          userRank: {
            rank: userRank || 'Unranked',
            points: userPoints ? userPoints.lifetimePoints : 0,
            currentPoints: userPoints ? userPoints.currentPoints : 0
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/gamification/leaderboard/branch
   */
  static async getBranchLeaderboard(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 50;

      let branch = req.query.branch;
      if (!branch) {
        const user = await User.findById(req.user.id).select('branch').lean();
        branch = user ? user.branch : null;
      }

      if (!branch) {
        return sendError(res, { statusCode: 400, message: 'Branch filter is required' });
      }

      const key = `leaderboard:branch:${branch}`;
      const leaderboard = await leaderboardService.getLeaderboard(key, page, limit);
      const userRank = await leaderboardService.getUserRankInLeaderboard(key, req.user.id);

      return sendSuccess(res, {
        message: `Branch: ${branch} leaderboard retrieved successfully`,
        data: {
          branch,
          leaderboard,
          userRank: { rank: userRank || 'Unranked' }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/gamification/leaderboard/college
   */
  static async getCollegeLeaderboard(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 50;

      let college = req.query.college;
      if (!college) {
        const user = await User.findById(req.user.id).select('college').lean();
        college = user ? user.college : null;
      }

      if (!college) {
        return sendError(res, { statusCode: 400, message: 'College filter is required' });
      }

      const key = `leaderboard:college:${college}`;
      const leaderboard = await leaderboardService.getLeaderboard(key, page, limit);
      const userRank = await leaderboardService.getUserRankInLeaderboard(key, req.user.id);

      return sendSuccess(res, {
        message: `College: ${college} leaderboard retrieved successfully`,
        data: {
          college,
          leaderboard,
          userRank: { rank: userRank || 'Unranked' }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/gamification/leaderboard/weekly
   */
  static async getWeeklyLeaderboard(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 50;

      const weekKey = GamificationController._getWeekKey();
      const key = `leaderboard:weekly:${weekKey}`;

      const leaderboard = await leaderboardService.getLeaderboard(key, page, limit);
      const userRank = await leaderboardService.getUserRankInLeaderboard(key, req.user.id);

      return sendSuccess(res, {
        message: 'Weekly leaderboard retrieved successfully',
        data: {
          week: weekKey,
          leaderboard,
          userRank: { rank: userRank || 'Unranked' }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/gamification/leaderboard/monthly
   */
  static async getMonthlyLeaderboard(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 50;

      const monthKey = GamificationController._getMonthKey();
      const key = `leaderboard:monthly:${monthKey}`;

      const leaderboard = await leaderboardService.getLeaderboard(key, page, limit);
      const userRank = await leaderboardService.getUserRankInLeaderboard(key, req.user.id);

      return sendSuccess(res, {
        message: 'Monthly leaderboard retrieved successfully',
        data: {
          month: monthKey,
          leaderboard,
          userRank: { rank: userRank || 'Unranked' }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/gamification/achievements
   */
  static async getAchievements(req, res, next) {
    try {
      const achievements = await Achievement.find({}).lean();
      const unlocked = await UserAchievement.find({ userId: req.user.id }).lean();
      const unlockedIds = new Set(unlocked.map(u => u.achievementId.toString()));

      const data = achievements.map(ach => {
        const isUnlocked = unlockedIds.has(ach._id.toString());
        const unlockDetails = isUnlocked ? unlocked.find(u => u.achievementId.toString() === ach._id.toString()) : null;
        
        return {
          id: ach._id,
          key: ach.key,
          name: ach.name,
          description: ach.description,
          pointsReward: ach.pointsReward,
          iconUrl: ach.iconUrl,
          unlocked: isUnlocked,
          unlockedAt: unlockDetails ? unlockDetails.unlockedAt : null
        };
      });

      return sendSuccess(res, {
        message: 'Achievements list retrieved successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/gamification/badges
   */
  static async getBadges(req, res, next) {
    try {
      const badges = await Badge.find({}).lean();
      const earned = await UserBadge.find({ userId: req.user.id }).lean();
      const earnedIds = new Set(earned.map(b => b.badgeId.toString()));

      const mappedBadges = badges.map(badge => ({
        id: badge._id,
        key: badge.key,
        name: badge.name,
        tier: badge.tier,
        description: badge.description,
        iconUrl: badge.iconUrl,
        earned: earnedIds.has(badge._id.toString())
      }));

      // Group by tiers
      const grouped = {
        bronze: mappedBadges.filter(b => b.tier === 'bronze'),
        silver: mappedBadges.filter(b => b.tier === 'silver'),
        gold: mappedBadges.filter(b => b.tier === 'gold'),
        legendary: mappedBadges.filter(b => b.tier === 'legendary'),
      };

      return sendSuccess(res, {
        message: 'Badges list retrieved successfully',
        data: grouped
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/gamification/reputation
   */
  static async getReputation(req, res, next) {
    try {
      let reputation = await UserReputation.findOne({ userId: req.user.id }).lean();
      if (!reputation) {
        reputation = {
          reputationScore: 1,
          breakdown: {
            contentQuality: 0,
            helpfulComments: 0,
            communityImpact: 0,
            projectSuccess: 0,
            consistency: 0
          },
          history: []
        };
      }

      return sendSuccess(res, {
        message: 'User reputation metrics retrieved successfully',
        data: reputation
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/gamification/points/update (Admin Only)
   */
  static async updatePoints(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array());
      }

      const { userId, points, reason } = req.body;

      const targetUser = await User.findById(userId);
      if (!targetUser) {
        return sendError(res, { statusCode: 404, message: 'Target user not found' });
      }

      // Handle points adjustment using pointsService
      const result = await pointsService.awardPoints(userId, 'admin_adjustment', null, {
        customPoints: points,
        reasonDescription: reason,
        adminUser: req.user.id
      });

      // Handle reputation adjustment if points was positive or negative
      if (points !== 0) {
        await reputationService.updateReputation(userId, 'admin_adjustment', null, {
          change: Math.round(points / 10) || (points > 0 ? 1 : -1),
          reason: `Admin adjustment: ${reason}`
        });
      }

      return sendSuccess(res, {
        message: 'User points adjusted successfully by Administrator',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/gamification/ranking/history
   */
  static async getRankingHistory(req, res, next) {
    try {
      const days = parseInt(req.query.days, 10) || 30;
      const history = await RankingHistory.find({ userId: req.user.id })
        .sort({ snapshotDate: 1 })
        .limit(days)
        .lean();

      return sendSuccess(res, {
        message: 'Ranking history retrieved successfully',
        data: history
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/gamification/comments/:commentId/helpful (Q&A/Discussion Action)
   */
  static async markCommentHelpful(req, res, next) {
    try {
      const { commentId } = req.params;
      const comment = await Comment.findById(commentId);
      if (!comment) {
        return sendError(res, { statusCode: 404, message: 'Comment not found' });
      }

      const post = await Post.findById(comment.postId);
      if (!post) {
        return sendError(res, { statusCode: 404, message: 'Parent post not found' });
      }

      // Only the author of the post or an admin can mark helpful
      const isAuthor = post.authorId.toString() === req.user.id;
      const isAdmin = req.user.role === 'admin' || req.user.role === 'moderator';

      if (!isAuthor && !isAdmin) {
        return sendError(res, { statusCode: 403, message: 'Only the post author or moderators can mark comments as helpful' });
      }

      // Check if already marked helpful in metadata
      if (comment.metadata && comment.metadata.isHelpful) {
        return sendError(res, { statusCode: 400, message: 'Comment is already marked as helpful' });
      }

      // Update comment metadata
      if (!comment.metadata) {
        comment.metadata = {};
      }
      comment.metadata.isHelpful = true;
      comment.markModified('metadata');
      await comment.save();

      // Award points and reputation to the commenter
      const pointsResult = await pointsService.awardPoints(comment.userId, 'helpful_answer', comment._id, {
        postId: post._id,
        markedBy: req.user.id
      });

      const isQA = post.type === 'question';
      const repReason = isQA ? 'answer_helpful' : 'comment_helpful';
      await reputationService.updateReputation(comment.userId, repReason, comment._id, {
        postId: post._id,
        markedBy: req.user.id
      });

      // Trigger Badge Engine checks for the commenter
      const badgeService = require('../services/badgeService');
      await badgeService.checkBadges(comment.userId, 'comment');

      return sendSuccess(res, {
        message: 'Comment marked as helpful. Points and reputation awarded to author.',
        data: {
          commentId: comment._id,
          helpful: true,
          pointsAwarded: pointsResult.pointsAwarded
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/gamification/rewards
   */
  static async getRewards(req, res, next) {
    try {
      const rewardService = require('../services/rewardService');
      const rewards = await rewardService.getActiveRewards();
      return sendSuccess(res, {
        message: 'Active rewards list retrieved successfully',
        data: rewards,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/gamification/rewards/redeem
   */
  static async redeemReward(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array());
      }

      const { rewardId } = req.body;
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

      const rewardService = require('../services/rewardService');
      const result = await rewardService.redeemReward(req.user.id, rewardId, ipAddress);

      return sendSuccess(res, {
        message: 'Reward redeemed successfully',
        data: result,
      });
    } catch (error) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
  }

  /**
   * GET /api/gamification/rewards/history
   */
  static async getRewardHistory(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const skip = (page - 1) * limit;

      const [transactions, total] = await Promise.all([
        RewardTransaction.find({ userId: req.user.id })
          .populate('rewardId', 'name description imageUrl pointsCost category')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        RewardTransaction.countDocuments({ userId: req.user.id }),
      ]);

      return sendSuccess(res, {
        message: 'Redemption transaction history retrieved successfully',
        data: {
          transactions,
          total,
          page,
          limit,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/gamification/rewards/admin/fulfill
   */
  static async fulfillRewardTransaction(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array());
      }

      const { transactionId, notes } = req.body;
      const rewardService = require('../services/rewardService');
      const transaction = await rewardService.fulfillTransaction(transactionId, req.user.id, notes);

      return sendSuccess(res, {
        message: 'Reward transaction status marked as fulfilled successfully',
        data: transaction,
      });
    } catch (error) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
  }

  /**
   * POST /api/gamification/rewards/admin/refund
   */
  static async refundRewardTransaction(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array());
      }

      const { transactionId, reason } = req.body;
      const rewardService = require('../services/rewardService');
      const transaction = await rewardService.refundTransaction(transactionId, req.user.id, reason);

      return sendSuccess(res, {
        message: 'Reward transaction refunded and points restored successfully',
        data: transaction,
      });
    } catch (error) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
  }
}

module.exports = GamificationController;
