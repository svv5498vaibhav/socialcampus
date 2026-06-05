const Achievement = require('../models/Achievement');
const UserAchievement = require('../models/UserAchievement');
const Post = require('../models/Post');
const PointsLog = require('../models/PointsLog');
const { createAndSendNotification, getIO } = require('./socketService');
const leaderboardService = require('./leaderboardService');

/**
 * Evaluates achievement milestones for a user
 * @param {string} userId 
 * @param {string} triggerType - e.g. 'post_count', 'project_count', 'like_count', 'point_threshold', 'rank_position'
 * @param {number} currentValue 
 */
const checkAndUnlock = async (userId, triggerType, currentValue) => {
  try {
    // 1. Fetch matching achievement definitions from database
    const achievements = await Achievement.find({ milestoneType: triggerType }).lean();
    if (achievements.length === 0) return;

    for (const ach of achievements) {
      // Check if already unlocked
      const alreadyEarned = await UserAchievement.findOne({ userId, achievementId: ach._id });
      if (alreadyEarned) {
        continue;
      }

      // Check threshold qualification
      let qualifies = false;
      let evaluatedVal = currentValue;

      if (triggerType === 'point_threshold' || triggerType === 'rank_position') {
        // We already have the current value passed
        qualifies = triggerType === 'rank_position'
          ? (evaluatedVal !== null && evaluatedVal <= ach.milestoneThreshold)
          : (evaluatedVal >= ach.milestoneThreshold);
      } else {
        // Query database to evaluate the current score if not passed or to double-check
        switch (triggerType) {
          case 'post_count': {
            const count = await Post.countDocuments({ authorId: userId });
            qualifies = count >= ach.milestoneThreshold;
            break;
          }
          case 'project_count': {
            const count = await Post.countDocuments({ authorId: userId, type: 'project' });
            qualifies = count >= ach.milestoneThreshold;
            break;
          }
          case 'like_count': {
            const posts = await Post.find({ authorId: userId }).select('likesCount').lean();
            const totalLikes = posts.reduce((sum, p) => sum + (p.likesCount || 0), 0);
            qualifies = totalLikes >= ach.milestoneThreshold;
            break;
          }
          case 'hackathon_count': {
            // Count posts of type 'achievement' or events tagged as hackathons
            const count = await Post.countDocuments({
              authorId: userId,
              $or: [
                { type: 'achievement', content: { $regex: /hackathon/i } },
                { type: 'event', 'metadata.isHackathon': true }
              ]
            });
            qualifies = count >= ach.milestoneThreshold;
            break;
          }
          case 'community_points': {
            const logs = await PointsLog.find({ userId, actionType: 'community_participation' }).select('pointsEarned').lean();
            const totalPoints = logs.reduce((sum, l) => sum + l.pointsEarned, 0);
            qualifies = totalPoints >= ach.milestoneThreshold;
            break;
          }
          default:
            break;
        }
      }

      if (qualifies) {
        // Unlock achievement
        await UserAchievement.create({ userId, achievementId: ach._id });

        // Deliver System Notification
        await createAndSendNotification(
          userId,
          null,
          'achievement',
          null,
          `Achievement Unlocked: ${ach.name}!`,
          ach.description
        );

        // Deliver real-time WebSocket push
        try {
          const io = getIO();
          io.to(`user:${userId}`).emit('achievement-unlock', {
            achievementId: ach._id,
            name: ach.name,
            description: ach.description,
            pointsReward: ach.pointsReward,
            iconUrl: ach.iconUrl,
          });
        } catch (ioErr) {
          // Socket might not be initialized
        }

        // Award points reward dynamically (avoids circular dependency)
        if (ach.pointsReward > 0) {
          const pointsService = require('./pointsService');
          await pointsService.awardPoints(userId, 'achievement_earned', ach._id, {
            achievementKey: ach.key,
            customPoints: ach.pointsReward,
          });
        }
      }
    }
  } catch (err) {
    console.error(`Error processing achievements for user ${userId}:`, err);
  }
};

module.exports = {
  checkAndUnlock,
};
