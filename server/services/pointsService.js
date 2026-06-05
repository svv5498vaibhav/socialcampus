const UserPoint = require('../models/UserPoint');
const PointsLog = require('../models/PointsLog');
const PointsRepository = require('../repositories/pointsRepository');
const { getIO } = require('./socketService');
const leaderboardService = require('./leaderboardService');

const POINT_RULES = {
  project_posted: { points: 50, capField: null, category: 'projects' },
  project_liked: { points: 5, capField: 'likes', dailyCap: 50, category: 'projects' },
  project_saved: { points: 10, capField: 'saves', dailyCap: 50, category: 'projects' },
  comment_added: { points: 2, capField: 'comments', dailyCap: 10, category: 'comments' },
  helpful_answer: { points: 20, capField: null, category: 'helpfulness' },
  community_participation: { points: 5, capField: null, category: 'community' },
  event_participation: { points: 15, capField: null, category: 'events' },
  hackathon_participation: { points: 100, capField: null, category: 'innovation' },
  achievement_earned: { points: 100, capField: null, category: 'innovation' },
  profile_completion: { points: 100, capField: null, category: 'community' },
  daily_activity: { points: 5, capField: 'dailyActivity', dailyCap: 5, category: 'community' },
  admin_adjustment: { points: 0, capField: null, category: null },
};

/**
 * Award points to a student
 * @param {string} userId 
 * @param {string} actionType 
 * @param {string|null} sourceId 
 * @param {object} metadata 
 */
const awardPoints = async (userId, actionType, sourceId = null, metadata = {}) => {
  const rule = POINT_RULES[actionType];
  if (!rule) {
    throw new Error(`Invalid action type: ${actionType}`);
  }

  const todayStr = new Date().toISOString().split('T')[0];
  let pointsToAward = rule.points;

  // If there's a custom override in metadata (e.g. from achievements/admin)
  if (metadata && typeof metadata.customPoints === 'number') {
    pointsToAward = metadata.customPoints;
  }

  let userPoint = await PointsRepository.findOrCreate(userId);

  // Enforce daily caps if applicable
  if (rule.capField) {
    // Reset daily caps if the day has changed
    if (userPoint.dailyCaps.date !== todayStr) {
      userPoint.dailyCaps.date = todayStr;
      userPoint.dailyCaps.categories.comments = 0;
      userPoint.dailyCaps.categories.likes = 0;
      userPoint.dailyCaps.categories.saves = 0;
      userPoint.dailyCaps.categories.dailyActivity = 0;
    }

    const currentCapValue = userPoint.dailyCaps.categories[rule.capField] || 0;
    const maxDaily = rule.dailyCap;

    if (currentCapValue >= maxDaily) {
      return {
        success: false,
        reason: `Daily cap of ${maxDaily} points for ${rule.capField} reached.`,
        currentPoints: userPoint.currentPoints,
        lifetimePoints: userPoint.lifetimePoints,
      };
    }

    if (currentCapValue + pointsToAward > maxDaily) {
      pointsToAward = maxDaily - currentCapValue;
    }

    userPoint.dailyCaps.categories[rule.capField] = currentCapValue + pointsToAward;
  }

  if (pointsToAward <= 0) {
    return {
      success: true,
      pointsAwarded: 0,
      currentPoints: userPoint.currentPoints,
    };
  }

  // Increment aggregate points
  userPoint.currentPoints += pointsToAward;
  userPoint.lifetimePoints += pointsToAward;
  userPoint.weeklyPoints += pointsToAward;
  userPoint.monthlyPoints += pointsToAward;

  // Increment category breakdown
  if (rule.category && userPoint.categoryPoints[rule.category] !== undefined) {
    userPoint.categoryPoints[rule.category] += pointsToAward;
  }

  // Update streak
  if (userPoint.streak.lastActiveDate !== todayStr) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (userPoint.streak.lastActiveDate === yesterdayStr) {
      userPoint.streak.currentStreak += 1;
      if (userPoint.streak.currentStreak > userPoint.streak.longestStreak) {
        userPoint.streak.longestStreak = userPoint.streak.currentStreak;
      }
    } else if (userPoint.streak.lastActiveDate !== '') {
      userPoint.streak.currentStreak = 1;
    } else {
      userPoint.streak.currentStreak = 1;
    }
    userPoint.streak.lastActiveDate = todayStr;
  }

  await userPoint.save();

  // Write log ledger
  await PointsLog.create({
    userId,
    actionType,
    pointsEarned: pointsToAward,
    sourceId,
    metadata,
  });

  // Sync to Redis Leaderboard asynchronously (don't block the response)
  leaderboardService.updateUserScore(userId, userPoint.lifetimePoints).catch((err) =>
    console.error(`Failed to sync leaderboard for user ${userId}:`, err.message)
  );

  // Trigger real-time Socket.IO update
  try {
    const io = getIO();
    io.to(`user:${userId}`).emit('points-update', {
      currentPoints: userPoint.currentPoints,
      lifetimePoints: userPoint.lifetimePoints,
      weeklyPoints: userPoint.weeklyPoints,
      monthlyPoints: userPoint.monthlyPoints,
      streak: userPoint.streak,
      change: pointsToAward,
      reason: actionType,
    });
  } catch (ioErr) {
    // Socket might not be initialized during testing/seeding
  }

  // Trigger achievement evaluation for point_threshold asynchronously
  const achievementService = require('./achievementService');
  achievementService.checkAndUnlock(userId, 'point_threshold', userPoint.lifetimePoints).catch((err) =>
    console.error(`Error processing achievements for user ${userId}:`, err.message)
  );

  // Also check streak-based achievements
  achievementService.checkAndUnlock(userId, 'streak_days', userPoint.streak.currentStreak).catch((err) =>
    console.error(`Error processing streak achievements for user ${userId}:`, err.message)
  );

  return {
    success: true,
    pointsAwarded: pointsToAward,
    currentPoints: userPoint.currentPoints,
    lifetimePoints: userPoint.lifetimePoints,
    weeklyPoints: userPoint.weeklyPoints,
    monthlyPoints: userPoint.monthlyPoints,
    streak: userPoint.streak,
  };
};

module.exports = {
  awardPoints,
  POINT_RULES,
};
