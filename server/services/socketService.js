const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('../config/environment');
const { corsOptions } = require('../config/cors');
const { createRedisClient, cache } = require('../config/redis');
const { createAdapter } = require('@socket.io/redis-adapter');

const Notification = require('../models/Notification');
const Activity = require('../models/Activity');
const mongoose = require('mongoose');
const User = require('../models/User');
const Profile = require('../models/Profile');

let io = null;
const activeSockets = new Map(); // userId -> Set of socketIds

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: corsOptions.origin,
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // 1. Horizontal Scaling - Configure Redis adapter if Redis is running
  const pubClient = createRedisClient();
  if (pubClient && cache.isAvailable()) {
    try {
      const subClient = pubClient.duplicate();
      io.adapter(createAdapter(pubClient, subClient));
      console.log('✅ Socket.IO: Redis Adapter loaded successfully for horizontal scaling');
    } catch (adapterErr) {
      console.warn('⚠️ Socket.IO: Redis Adapter load failed, falling back to local memory adapter:', adapterErr.message);
    }
  }

  // 2. Authentication Middleware for Sockets
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication failed: Token missing'));
      }

      const decoded = jwt.verify(token, env.jwt.accessSecret);
      socket.user = {
        id: decoded.id,
        role: decoded.role
      };
      next();
    } catch (err) {
      return next(new Error('Authentication failed: Invalid token'));
    }
  });

  // 3. Connection Handler
  io.on('connection', async (socket) => {
    const userId = socket.user.id;
    console.log(`🔌 Socket connected: ${socket.id} (User: ${userId})`);

    // Custom socket rate limiter middleware
    const rateLimitMap = new Map();
    socket.use(async (packet, next) => {
      const eventName = packet[0];
      if (eventName === 'heartbeat' || eventName === 'ping') {
        return next();
      }

      const limitWindow = 10; // seconds
      const maxRequests = 30;

      try {
        if (pubClient && cache.isAvailable()) {
          const rateKey = `rate:socket:${socket.id}`;
          const currentRequests = await pubClient.incr(rateKey);
          if (currentRequests === 1) {
            await pubClient.expire(rateKey, limitWindow);
          }
          if (currentRequests > maxRequests) {
            socket.emit('abuse-warning', { message: 'Too many requests. Please slow down.' });
            if (currentRequests > maxRequests * 1.5) {
              socket.disconnect(true);
            }
            return; // block execution
          }
        } else {
          const now = Math.floor(Date.now() / 1000);
          if (!rateLimitMap.has(socket.id)) {
            rateLimitMap.set(socket.id, { count: 0, resetTime: now + limitWindow });
          }
          const limitData = rateLimitMap.get(socket.id);
          if (now > limitData.resetTime) {
            limitData.count = 1;
            limitData.resetTime = now + limitWindow;
          } else {
            limitData.count += 1;
          }
          if (limitData.count > maxRequests) {
            socket.emit('abuse-warning', { message: 'Too many requests. Please slow down.' });
            if (limitData.count > maxRequests * 1.5) {
              socket.disconnect(true);
            }
            return; // block execution
          }
        }
        next();
      } catch (err) {
        next(err);
      }
    });

    // Track Socket ID mapping locally (always backup)
    if (!activeSockets.has(userId)) {
      activeSockets.set(userId, new Set());
    }
    activeSockets.get(userId).add(socket.id);

    // Track in Redis presence set for multi-instance clusters
    if (pubClient && cache.isAvailable()) {
      try {
        await pubClient.sadd(`presence:active_sockets:${userId}`, socket.id);
        await pubClient.expire(`presence:active_sockets:${userId}`, 86400); // 24h safety expiry
      } catch (err) {
        console.error('Failed to add socket to Redis presence set:', err);
      }
    }

    // Join user-specific notification channel
    socket.join(`user:${userId}`);

    // Set user presence status to ONLINE
    await setPresence(userId, 'online');

    // Fetch user branch/college/following and subscribe socket to relevant rooms
    try {
      const [userData, userProfile] = await Promise.all([
        User.findById(userId).select('branch college').lean(),
        Profile.findOne({ userId }).select('following').lean()
      ]);

      if (userData) {
        if (userData.branch) {
          socket.join(`branch:${userData.branch}`);
          console.log(`Socket ${socket.id} joined branch room: branch:${userData.branch}`);
        }
        if (userData.college) {
          socket.join(`college:${userData.college}`);
          console.log(`Socket ${socket.id} joined college room: college:${userData.college}`);
        }
      }

      if (userProfile && userProfile.following) {
        userProfile.following.forEach(followedId => {
          socket.join(`followers:${followedId.toString()}`);
        });
        console.log(`Socket ${socket.id} joined follower rooms for ${userProfile.following.length} authors`);
      }
    } catch (err) {
      console.error(`Error performing dynamic room subscriptions for socket ${socket.id}:`, err);
    }

    // ── Room Subscriptions ──
    socket.on('join-post-room', (postId) => {
      if (postId && mongoose.Types.ObjectId.isValid(postId)) {
        socket.join(`post:${postId}`);
        console.log(`Socket ${socket.id} joined post room: ${postId}`);
      } else {
        socket.emit('error-event', { message: 'Invalid postId format' });
      }
    });

    socket.on('leave-post-room', (postId) => {
      if (postId && mongoose.Types.ObjectId.isValid(postId)) {
        socket.leave(`post:${postId}`);
        console.log(`Socket ${socket.id} left post room: ${postId}`);
      }
    });

    // Dynamic follower subscriptions (follow / unfollow actions in real-time)
    socket.on('subscribe-to-user', (targetUserId) => {
      if (targetUserId && mongoose.Types.ObjectId.isValid(targetUserId)) {
        socket.join(`followers:${targetUserId}`);
        console.log(`Socket ${socket.id} subscribed to author room: followers:${targetUserId}`);
      } else {
        socket.emit('error-event', { message: 'Invalid targetUserId format' });
      }
    });

    socket.on('unsubscribe-from-user', (targetUserId) => {
      if (targetUserId && mongoose.Types.ObjectId.isValid(targetUserId)) {
        socket.leave(`followers:${targetUserId}`);
        console.log(`Socket ${socket.id} unsubscribed from author room: followers:${targetUserId}`);
      }
    });

    // ── Connection Disconnect ──
    socket.on('disconnect', async () => {
      console.log(`🔌 Socket disconnected: ${socket.id} (User: ${userId})`);
      
      // Cleanup local map to prevent memory leak
      const userSockets = activeSockets.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          activeSockets.delete(userId);
        }
      }

      let isLastSocket = false;

      // Track in Redis presence set for multi-instance clusters
      if (pubClient && cache.isAvailable()) {
        try {
          await pubClient.srem(`presence:active_sockets:${userId}`, socket.id);
          const activeCount = await pubClient.scard(`presence:active_sockets:${userId}`);
          if (activeCount === 0) {
            isLastSocket = true;
          }
        } catch (err) {
          console.error('Failed to remove socket from Redis presence set:', err);
          isLastSocket = !activeSockets.has(userId);
        }
      } else {
        isLastSocket = !activeSockets.has(userId);
      }

      if (isLastSocket) {
        // Trigger OFFLINE presence transition after debounce to prevent twitching
        setTimeout(async () => {
          let shouldSetOffline = false;
          if (pubClient && cache.isAvailable()) {
            try {
              const activeCount = await pubClient.scard(`presence:active_sockets:${userId}`);
              if (activeCount === 0) {
                shouldSetOffline = true;
              }
            } catch {
              shouldSetOffline = !activeSockets.has(userId);
            }
          } else {
            shouldSetOffline = !activeSockets.has(userId);
          }

          if (shouldSetOffline) {
            await setPresence(userId, 'offline');
          }
        }, 5000); // 5 seconds grace period
      }
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet!');
  }
  return io;
};

// ── Presence Management ──

const setPresence = async (userId, status) => {
  try {
    const key = `presence:user:${userId}`;
    const timestamp = Date.now();

    if (status === 'online') {
      await cache.set(key, JSON.stringify({ status: 'online', lastActive: timestamp }));
      if (io) {
        io.emit('presence-update', { userId, status: 'online', lastActive: timestamp });
      }
    } else {
      await cache.set(key, JSON.stringify({ status: 'offline', lastActive: timestamp }));
      if (io) {
        io.emit('presence-update', { userId, status: 'offline', lastActive: timestamp });
      }
    }
  } catch (err) {
    console.error('Error setting user presence:', err);
  }
};

const getUserPresence = async (userId) => {
  try {
    const key = `presence:user:${userId}`;
    const data = await cache.get(key);
    return data ? JSON.parse(data) : { status: 'offline', lastActive: null };
  } catch {
    return { status: 'offline', lastActive: null };
  }
};

// ── Real-Time Engagement Broadcasts ──

const notifyEngagement = (postId, metrics) => {
  if (!io) return;
  // Send to post-room viewers
  io.to(`post:${postId}`).emit('engagement-update', { postId, ...metrics });
  // Send globally to keep feeds synchronized
  io.emit('engagement-update', { postId, ...metrics });
};

const notifyNewPost = (post) => {
  if (!io) return;
  const payload = {
    postId: post._id,
    type: post.type,
    authorName: post.authorId ? `${post.authorId.firstName} ${post.authorId.lastName}` : 'CampusX',
    summary: post.aiSummary,
    title: post.title,
    createdAt: post.createdAt
  };

  // Emit globally
  io.emit('new-post', payload);

  // Emit to branch community room
  if (post.authorId && post.authorId.branch) {
    io.to(`branch:${post.authorId.branch}`).emit('new-post-branch', payload);
  }

  // Emit to followers room
  if (post.authorId && post.authorId._id) {
    io.to(`followers:${post.authorId._id.toString()}`).emit('new-post-follower', payload);
  }
};

const notifyTrending = (trendingPosts) => {
  if (!io) return;
  io.emit('trending-update', { trendingPosts });
};

// ── Activity Stream logger ──

const logActivity = async (userId, action, targetId = null, metadata = {}) => {
  try {
    await Activity.create({
      userId,
      action,
      targetId,
      metadata
    });
    
    // Broadcast to followers / activity feeds if any
    if (io) {
      io.emit('activity-stream', {
        userId,
        action,
        targetId,
        metadata,
        timestamp: new Date()
      });
    }
  } catch (err) {
    console.error('Activity logging failed:', err.message);
  }
};

// ── Notification delivery pipeline ──

const createAndSendNotification = async (recipientId, senderId, type, postId, title, message) => {
  try {
    const PulseNotificationService = require('./pulseNotificationService');
    return await PulseNotificationService.sendNotification(recipientId, senderId, type, postId, title, message);
  } catch (err) {
    console.error('Failed to deliver notification:', err.message);
  }
};

module.exports = {
  initSocket,
  getIO,
  setPresence,
  getUserPresence,
  notifyEngagement,
  notifyNewPost,
  notifyTrending,
  logActivity,
  createAndSendNotification
};
