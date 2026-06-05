const Badge = require('../models/Badge');
const UserBadge = require('../models/UserBadge');
const Post = require('../models/Post');
const Profile = require('../models/Profile');
const PointsLog = require('../models/PointsLog');
const UserReputation = require('../models/UserReputation');
const User = require('../models/User');
const { createAndSendNotification, getIO } = require('./socketService');
const leaderboardService = require('./leaderboardService');

/**
 * Check and award badges matching a metric update
 * @param {string} userId 
 * @param {string} triggerMetric - e.g. 'reputation', 'posts', 'helpful_replies', 'rank'
 * @param {any} triggerValue 
 */
const checkBadges = async (userId, triggerMetric, triggerValue) => {
  try {
    // 1. Fetch all badges from database
    const badges = await Badge.find({}).lean();
    
    // Map triggerMetric to badge rule metric
    const metricMapping = {
      reputation: ['reputation'],
      post: ['posts_contribution', 'projects', 'quality_projects', 'activity_count', 'community_impact'],
      comment: ['helpful_replies', 'activity_count'],
      rank: ['college_rank', 'overall_rank'],
    };

    const targetMetrics = metricMapping[triggerMetric] || [];
    if (targetMetrics.length === 0) return;

    for (const badge of badges) {
      if (!targetMetrics.includes(badge.rules.metric)) {
        continue;
      }

      // Check if user already has this badge
      const alreadyEarned = await UserBadge.findOne({ userId, badgeId: badge._id });
      if (alreadyEarned) {
        continue;
      }

      // Evaluate qualification
      let qualifies = false;
      const rules = badge.rules;

      switch (rules.metric) {
        case 'activity_count': {
          const logsCount = await PointsLog.countDocuments({ userId });
          qualifies = logsCount >= rules.threshold;
          break;
        }
        case 'posts_contribution': {
          const count = await Post.countDocuments({ 
            authorId: userId, 
            type: { $in: ['discussion', 'resource'] } 
          });
          qualifies = count >= rules.threshold;
          break;
        }
        case 'reputation': {
          qualifies = triggerValue >= rules.threshold;
          break;
        }
        case 'helpful_replies': {
          const count = await PointsLog.countDocuments({ userId, actionType: 'helpful_answer' });
          qualifies = count >= rules.threshold;
          break;
        }
        case 'projects': {
          const count = await Post.countDocuments({ authorId: userId, type: 'project' });
          qualifies = count >= rules.threshold;
          break;
        }
        case 'quality_projects': {
          const count = await Post.countDocuments({ 
            authorId: userId, 
            type: 'project', 
            qualityScore: { $gte: rules.minQualityScore || 75 } 
          });
          qualifies = count >= rules.threshold;
          break;
        }
        case 'community_impact': {
          const profile = await Profile.findOne({ userId }).lean();
          const followerCount = profile && profile.followers ? profile.followers.length : 0;
          const eventCount = await Post.countDocuments({ authorId: userId, type: 'event' });
          
          qualifies = eventCount >= (rules.eventsThreshold || 3) || followerCount >= (rules.followersThreshold || 5);
          break;
        }
        case 'college_rank': {
          const user = await User.findById(userId).select('college').lean();
          if (user && user.college) {
            const rank = await leaderboardService.getUserRankInLeaderboard(`leaderboard:college:${user.college}`, userId);
            qualifies = rank !== null && rank <= rules.threshold;
          }
          break;
        }
        case 'overall_rank': {
          const rank = await leaderboardService.getUserRankInLeaderboard('leaderboard:overall', userId);
          qualifies = rank !== null && rank <= rules.threshold;
          break;
        }
        default:
          break;
      }

      if (qualifies) {
        // Unlock badge
        await UserBadge.create({ userId, badgeId: badge._id });

        // Send system notification
        await createAndSendNotification(
          userId,
          null,
          'achievement',
          null,
          `New Badge Unlocked: ${badge.name}!`,
          badge.description
        );

        // Send real-time socket unlock
        try {
          const io = getIO();
          io.to(`user:${userId}`).emit('badge-unlock', {
            badgeId: badge._id,
            name: badge.name,
            tier: badge.tier,
            iconUrl: badge.iconUrl,
            description: badge.description,
          });
        } catch (ioErr) {
          // Socket might not be initialized
        }

        // Award points bonus based on tier
        const tierPoints = {
          bronze: 50,
          silver: 100,
          gold: 200,
          legendary: 500,
        };
        const bonus = tierPoints[badge.tier] || 50;

        const pointsService = require('./pointsService');
        await pointsService.awardPoints(userId, 'achievement_earned', badge._id, {
          badgeKey: badge.key,
          customPoints: bonus,
        });
      }
    }
  } catch (err) {
    console.error(`Error checking badges for user ${userId}:`, err);
  }
};

module.exports = {
  checkBadges,
};
