const Post = require('../models/Post');
const User = require('../models/User');
const { createRedisClient, cache } = require('../config/redis');

const getRedis = () => {
  try {
    if (cache.isAvailable()) {
      return createRedisClient();
    }
  } catch (err) {}
  return null;
};

/**
 * Anti-Cheat and Anti-Abuse Guard Middleware
 * @param {string} action - 'like', 'save', 'comment', 'post'
 */
const antiCheatGuard = (action) => {
  return async (req, res, next) => {
    try {
      req.skipGamification = false;
      const userId = req.user.id;
      const { postId } = req.body;

      // 1. Self-Interaction Block
      if (postId && ['like', 'save', 'comment'].includes(action)) {
        const post = await Post.findById(postId).select('authorId').lean();
        if (post) {
          if (post.authorId.toString() === userId.toString()) {
            req.skipGamification = true;
            req.gamificationReason = 'self_interaction';
            return next();
          }

          // 2. Sybil / IP Cohort Checking
          // Check if author and liker/commenter share the same IP
          const [actorUser, authorUser] = await Promise.all([
            User.findById(userId).select('lastLoginIp registrationIp').lean(),
            User.findById(post.authorId).select('lastLoginIp registrationIp').lean(),
          ]);

          if (actorUser && authorUser) {
            const sameLastIp = actorUser.lastLoginIp && actorUser.lastLoginIp === authorUser.lastLoginIp;
            const sameRegIp = actorUser.registrationIp && actorUser.registrationIp === authorUser.registrationIp;
            
            if (sameLastIp || sameRegIp) {
              req.skipGamification = true;
              req.gamificationReason = 'shared_ip_cohort';
              return next();
            }
          }
        }
      }

      // 3. Velocity / Rate-Limiting using Redis sliding window
      const redis = getRedis();
      if (redis) {
        const now = Date.now();
        
        if (action === 'like') {
          const key = `rate:gamification:like:${userId}`;
          // 5 minutes window = 300,000 ms. Limit: 10 likes
          const windowMs = 300 * 1000;
          const limit = 10;

          await redis.zremrangebyscore(key, 0, now - windowMs);
          const activeLikesCount = await redis.zcard(key);

          if (activeLikesCount >= limit) {
            req.skipGamification = true;
            req.gamificationReason = 'velocity_limit_exceeded';
            return next();
          }
          await redis.zadd(key, now, `${now}-${Math.random()}`);
          await redis.expire(key, 305);
        }

        if (action === 'comment') {
          const key = `rate:gamification:comment:${userId}`;
          // 10 minutes window = 600,000 ms. Limit: 20 comments
          const windowMs = 600 * 1000;
          const limit = 20;

          await redis.zremrangebyscore(key, 0, now - windowMs);
          const activeCommentsCount = await redis.zcard(key);

          if (activeCommentsCount >= limit) {
            req.skipGamification = true;
            req.gamificationReason = 'velocity_limit_exceeded';
            return next();
          }
          await redis.zadd(key, now, `${now}-${Math.random()}`);
          await redis.expire(key, 605);
        }
      }

      next();
    } catch (error) {
      console.error('Error in antiCheatGuard middleware:', error.message);
      // Fail-open for the base request (don't block post/like creation if gamification checks fail)
      req.skipGamification = true;
      next();
    }
  };
};

module.exports = {
  antiCheatGuard,
};
