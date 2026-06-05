const { createRedisClient, cache } = require('../config/redis');
const UserPoint = require('../models/UserPoint');
const UserReputation = require('../models/UserReputation');
const User = require('../models/User');

const getRedisClient = () => {
  try {
    if (cache.isAvailable()) {
      return createRedisClient();
    }
  } catch (err) {
    // Redis not available
  }
  return null;
};

/**
 * Sync user points score to relevant Redis Sorted Sets
 * @param {string} userId 
 * @param {number} points 
 */
const updateUserScore = async (userId, points) => {
  const redis = getRedisClient();
  const user = await User.findById(userId).select('college branch semester').lean();
  if (!user) return;

  const today = new Date();
  // Get Year-Month (e.g. 2026-06)
  const yyyyMm = today.toISOString().slice(0, 7);
  // Get Year-Week (e.g. 2026-23)
  const getYearWeek = (d) => {
    const tempDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = tempDate.getUTCDay() || 7;
    tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
    return `${tempDate.getUTCFullYear()}-${Math.ceil((((tempDate - yearStart) / 86400000) + 1) / 7)}`;
  };
  const yyyyWw = getYearWeek(today);

  if (redis) {
    const pipeline = redis.pipeline();

    // 1. Overall Points ZSET
    pipeline.zadd('leaderboard:overall', points, userId.toString());

    // 2. Monthly ZSET
    pipeline.zadd(`leaderboard:monthly:${yyyyMm}`, points, userId.toString());

    // 3. Weekly ZSET
    pipeline.zadd(`leaderboard:weekly:${yyyyWw}`, points, userId.toString());

    // 4. College ZSET
    if (user.college) {
      pipeline.zadd(`leaderboard:college:${user.college}`, points, userId.toString());
    }

    // 5. Branch ZSET
    if (user.branch) {
      pipeline.zadd(`leaderboard:branch:${user.branch}`, points, userId.toString());
    }

    // 6. Semester ZSET
    if (user.semester) {
      pipeline.zadd(`leaderboard:semester:${user.semester}`, points, userId.toString());
    }

    await pipeline.exec();
  }

  // Check and evaluate rank milestones dynamically (avoids circular dependency)
  const rank = await getUserRankInLeaderboard('leaderboard:overall', userId);
  if (rank !== null) {
    // Detect overall rank changes in real-time
    const lastRankKey = `user:last_rank:${userId}`;
    try {
      const lastRankStr = await cache.get(lastRankKey);
      const lastRank = lastRankStr ? parseInt(lastRankStr, 10) : null;
      if (lastRank !== rank) {
        await cache.set(lastRankKey, String(rank), 86400 * 7); // 7 days expire
        
        // Emit rank-update Socket notification
        const { getIO } = require('./socketService');
        const io = getIO();
        io.to(`user:${userId}`).emit('rank-update', {
          rank,
          previousRank: lastRank,
          leaderboard: 'overall'
        });
      }
    } catch (cacheErr) {
      // Ignored cache/socket errors
    }

    if (rank <= 10) {
      const achievementService = require('./achievementService');
      achievementService.checkAndUnlock(userId, 'rank_position', rank).catch((err) =>
        console.error(`Error checking rank achievement for user ${userId}:`, err.message)
      );
    }
  }
};

/**
 * Get rank positions list
 * @param {string} leaderboardKey 
 * @param {number} page 
 * @param {number} limit 
 */
const getLeaderboard = async (leaderboardKey, page = 1, limit = 50) => {
  const redis = getRedisClient();
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  let rankedMembers = []; // Array of { userId, score }

  if (redis) {
    try {
      const results = await redis.zrevrange(leaderboardKey, start, end, 'WITHSCORES');
      // Redis zrevrange with WITHSCORES returns: [userId, score, userId, score, ...]
      for (let i = 0; i < results.length; i += 2) {
        rankedMembers.push({
          userId: results[i],
          score: parseFloat(results[i + 1]),
        });
      }
    } catch (err) {
      console.error('Redis leaderboard fetch failed, falling back to DB:', err.message);
      rankedMembers = await _getLeaderboardFallback(leaderboardKey, start, limit);
    }
  } else {
    rankedMembers = await _getLeaderboardFallback(leaderboardKey, start, limit);
  }

  if (rankedMembers.length === 0) {
    return [];
  }

  // Retrieve user profiles
  const userIds = rankedMembers.map((m) => m.userId);
  const users = await User.find({ _id: { $in: userIds } })
    .select('firstName lastName college branch semester email')
    .lean();

  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  return rankedMembers.map((m, index) => {
    const user = userMap.get(m.userId) || {};
    return {
      rank: start + index + 1,
      userId: m.userId,
      fullName: user.firstName ? `${user.firstName} ${user.lastName}` : 'CampusX Student',
      email: user.email,
      college: user.college,
      branch: user.branch,
      semester: user.semester,
      score: m.score,
    };
  });
};

/**
 * Fetch user rank in a specific leaderboard
 * @param {string} leaderboardKey 
 * @param {string} userId 
 */
const getUserRankInLeaderboard = async (leaderboardKey, userId) => {
  const redis = getRedisClient();

  if (redis) {
    try {
      const rank = await redis.zrevrank(leaderboardKey, userId.toString());
      return rank !== null ? rank + 1 : null;
    } catch (err) {
      console.error('Redis zrevrank failed:', err.message);
    }
  }

  // Fallback to database ranking query
  return await _getUserRankFallback(leaderboardKey, userId);
};

// ── Database Fallbacks (MongoDB operations when Redis is down/disabled) ──

const _getLeaderboardFallback = async (key, skip, limit) => {
  // If key has college/branch filters, apply them
  const filter = {};
  
  if (key.startsWith('leaderboard:college:')) {
    const college = key.replace('leaderboard:college:', '');
    const users = await User.find({ college }).select('_id').lean();
    filter.userId = { $in: users.map((u) => u._id) };
  } else if (key.startsWith('leaderboard:branch:')) {
    const branch = key.replace('leaderboard:branch:', '');
    const users = await User.find({ branch }).select('_id').lean();
    filter.userId = { $in: users.map((u) => u._id) };
  } else if (key.startsWith('leaderboard:semester:')) {
    const semester = key.replace('leaderboard:semester:', '');
    const users = await User.find({ semester }).select('_id').lean();
    filter.userId = { $in: users.map((u) => u._id) };
  }

  if (key.includes('reputation')) {
    const reps = await UserReputation.find(filter)
      .sort({ reputationScore: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    return reps.map((r) => ({ userId: r.userId.toString(), score: r.reputationScore }));
  } else {
    const points = await UserPoint.find(filter)
      .sort({ lifetimePoints: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    return points.map((p) => ({ userId: p.userId.toString(), score: p.lifetimePoints }));
  }
};

const _getUserRankFallback = async (key, userId) => {
  const user = await User.findById(userId).lean();
  if (!user) return null;

  const filter = {};
  if (key.startsWith('leaderboard:college:')) {
    const users = await User.find({ college: user.college }).select('_id').lean();
    filter.userId = { $in: users.map((u) => u._id) };
  } else if (key.startsWith('leaderboard:branch:')) {
    const users = await User.find({ branch: user.branch }).select('_id').lean();
    filter.userId = { $in: users.map((u) => u._id) };
  } else if (key.startsWith('leaderboard:semester:')) {
    const users = await User.find({ semester: user.semester }).select('_id').lean();
    filter.userId = { $in: users.map((u) => u._id) };
  }

  if (key.includes('reputation')) {
    const repObj = await UserReputation.findOne({ userId }).select('reputationScore').lean();
    if (!repObj) return null;
    filter.reputationScore = { $gt: repObj.reputationScore };
    const betterUsersCount = await UserReputation.countDocuments(filter);
    return betterUsersCount + 1;
  } else {
    const pointsObj = await UserPoint.findOne({ userId }).select('lifetimePoints').lean();
    if (!pointsObj) return null;
    filter.lifetimePoints = { $gt: pointsObj.lifetimePoints };
    const betterUsersCount = await UserPoint.countDocuments(filter);
    return betterUsersCount + 1;
  }
};

module.exports = {
  updateUserScore,
  getLeaderboard,
  getUserRankInLeaderboard,
};
