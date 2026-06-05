const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const ioClient = require('socket.io-client');
const assert = require('assert');

const env = require('../config/environment');
const connectDatabase = require('../config/database');
const { connectRedis } = require('../config/redis');
const { initSocket, getIO } = require('../services/socketService');

const User = require('../models/User');
const Profile = require('../models/Profile');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const Activity = require('../models/Activity');
const FeedService = require('../services/feedService');
const TrendingEngine = require('../services/trendingEngine');

let server = null;
let io = null;

// Mock data IDs
const userAId = new mongoose.Types.ObjectId();
const userBId = new mongoose.Types.ObjectId();
const postId = new mongoose.Types.ObjectId();

let tokenA = '';
let tokenB = '';

async function setup() {
  console.log('🔄 Setting up test database connections...');
  await connectDatabase();
  await connectRedis();

  // Clear mock collections
  await Promise.all([
    User.deleteMany({ email: { $in: ['usera@campusx.edu', 'userb@campusx.edu'] } }),
    Profile.deleteMany({ $or: [{ userId: { $in: [userAId, userBId] } }, { username: { $in: ['usera', 'userb'] } }] }),
    Post.deleteMany({ authorId: { $in: [userAId, userBId] } }),
    Notification.deleteMany({ recipientId: { $in: [userAId, userBId] } }),
    Activity.deleteMany({ userId: { $in: [userAId, userBId] } })
  ]);

  // Create Mock Users
  await User.create([
    {
      _id: userAId,
      email: 'usera@campusx.edu',
      passwordHash: 'dummyhash',
      firstName: 'Student',
      lastName: 'Alpha',
      college: 'CampusX College',
      branch: 'Computer Science',
      semester: '1',
      status: 'active',
      emailVerified: true,
      isVerified: true
    },
    {
      _id: userBId,
      email: 'userb@campusx.edu',
      passwordHash: 'dummyhash',
      firstName: 'Student',
      lastName: 'Beta',
      college: 'CampusX College',
      branch: 'Computer Science',
      semester: '1',
      status: 'active',
      emailVerified: true,
      isVerified: true
    }
  ]);

  // Create Mock Profiles
  await Profile.create([
    {
      userId: userAId,
      username: 'usera',
      onboardingCompleted: true,
      following: []
    },
    {
      userId: userBId,
      username: 'userb',
      onboardingCompleted: true,
      following: [userAId] // B follows A
    }
  ]);

  tokenA = jwt.sign({ id: userAId.toString(), role: 'student' }, env.jwt.accessSecret);
  tokenB = jwt.sign({ id: userBId.toString(), role: 'student' }, env.jwt.accessSecret);

  // Initialize Socket.IO Server on separate port 5002
  const app = express();
  server = http.createServer(app);
  io = initSocket(server);

  await new Promise((resolve) => {
    server.listen(5002, () => {
      console.log('✅ Mock Socket.IO server running on port 5002');
      resolve();
    });
  });
}

function runTest(name, fn) {
  return async () => {
    try {
      await fn();
      console.log(`✅ TEST PASSED: ${name}`);
    } catch (err) {
      console.error(`❌ TEST FAILED: ${name}`);
      console.error(err);
      process.exit(1);
    }
  };
}

async function main() {
  await setup();

  console.log('\n🧪 Running Phase 4 Live Feed Infrastructure tests...\n');

  // 1. JWT Authentication verification
  await runTest('Socket Auth - Reject invalid token', async () => {
    await new Promise((resolve) => {
      const client = ioClient('http://localhost:5002', {
        auth: { token: 'invalid-token' },
        transports: ['websocket'],
        reconnection: false
      });

      client.on('connect_error', (err) => {
        assert.strictEqual(err.message, 'Authentication failed: Invalid token');
        client.close();
        resolve();
      });
    });
  })();

  // 2. Room joins and presence tracking
  await runTest('Presence & Room Join - Authenticate, map online presence, and join branch/college rooms', async () => {
    let presenceUpdateReceived = false;

    // Connect User A first to listen for User B's presence update
    const clientA = ioClient('http://localhost:5002', {
      auth: { token: tokenA },
      transports: ['websocket']
    });

    await new Promise((resolve) => {
      clientA.on('connect', () => {
        clientA.on('presence-update', (data) => {
          if (data.userId === userBId.toString() && data.status === 'online') {
            presenceUpdateReceived = true;
          }
        });
        resolve();
      });
    });

    const clientB = ioClient('http://localhost:5002', {
      auth: { token: tokenB },
      transports: ['websocket']
    });

    await new Promise((resolve) => {
      clientB.on('connect', resolve);
    });

    // Wait a brief moment for dynamic rooms to join and presence to emit
    await new Promise(r => setTimeout(r, 100));

    assert.ok(presenceUpdateReceived, 'User A should receive presence update for User B joining');

    clientA.close();
    clientB.close();
  })();

  // 3. Real-time post feed updates (Followers & Branch community notifications)
  await runTest('Live Post Broadcast - B receives live feed updates when A posts (A is followed by B)', async () => {
    const clientB = ioClient('http://localhost:5002', {
      auth: { token: tokenB },
      transports: ['websocket']
    });

    await new Promise((resolve) => {
      clientB.on('connect', resolve);
    });

    let followerEventReceived = false;
    let branchEventReceived = false;

    clientB.on('new-post-follower', (data) => {
      followerEventReceived = true;
    });

    clientB.on('new-post-branch', (data) => {
      branchEventReceived = true;
    });

    // User A creates a post
    await FeedService.createPost(userAId, {
      title: 'Real-time Socket Post',
      content: 'This post is created as a part of testing the websocket social synchronization.',
      metadata: { techStack: ['JavaScript', 'Socket.io'] }
    });

    await new Promise(r => setTimeout(r, 200));

    assert.ok(branchEventReceived, 'User B should receive branch room post event');
    assert.ok(followerEventReceived, 'User B should receive follower room post event');

    clientB.close();
  })();

  // 4. Mention notifications
  await runTest('Mentions Pipeline - Posting content mentioning @userb creates notifications in real-time', async () => {
    const clientB = ioClient('http://localhost:5002', {
      auth: { token: tokenB },
      transports: ['websocket']
    });

    await new Promise((resolve) => {
      clientB.on('connect', resolve);
    });

    let notificationReceived = false;
    clientB.on('notification', (data) => {
      if (data.type === 'mention') {
        notificationReceived = true;
      }
    });

    // User A posts with mention
    await FeedService.createPost(userAId, {
      title: 'Project Update @userb',
      content: 'Hey @userb, check out our new project updates!',
      metadata: { techStack: ['Node'] }
    });

    await new Promise(r => setTimeout(r, 200));

    assert.ok(notificationReceived, 'User B should receive live mention notification');

    // Confirm stored in DB
    const dbNotif = await Notification.findOne({ recipientId: userBId, type: 'mention' });
    assert.ok(dbNotif, 'Mention notification should be saved to database');
    assert.strictEqual(dbNotif.title, 'Mentioned! 🏷️');

    clientB.close();
  })();

  // 5. Engagement Broadcasts (Likes)
  await runTest('Likes and Trending Sync - User B likes A\'s post, B receives count sync and post is added to trending', async () => {
    // Create new post to like
    const post = await FeedService.createPost(userAId, {
      title: 'Trending post test',
      content: 'Testing trending recalculations and live sync on likes counts.',
      metadata: {}
    });

    const clientB = ioClient('http://localhost:5002', {
      auth: { token: tokenB },
      transports: ['websocket']
    });

    await new Promise((resolve) => {
      clientB.on('connect', () => {
        clientB.emit('join-post-room', post._id.toString());
        resolve();
      });
    });

    let countSyncReceived = false;
    clientB.on('engagement-update', (data) => {
      if (data.postId === post._id.toString() && data.likesCount === 1) {
        countSyncReceived = true;
      }
    });

    // User B likes post
    await FeedService.toggleLike(post._id, userBId);

    await new Promise(r => setTimeout(r, 200));

    assert.ok(countSyncReceived, 'User B should receive likes count sync event');

    // User A should also have a Like notification in DB
    const likeNotif = await Notification.findOne({ recipientId: userAId, type: 'like' });
    assert.ok(likeNotif, 'Like notification should be sent to Author A');

    clientB.close();
  })();

  // 6. Rate Limiting Warning
  await runTest('Socket Security - Spanning rate limit threshold triggers warning', async () => {
    const client = ioClient('http://localhost:5002', {
      auth: { token: tokenA },
      transports: ['websocket'],
      reconnection: false
    });

    await new Promise((resolve) => {
      client.on('connect', resolve);
    });

    let warningReceived = false;
    client.on('abuse-warning', (data) => {
      warningReceived = true;
    });

    // Spam messages to trigger rate limit (threshold is 30 in 10s)
    for (let i = 0; i < 40; i++) {
      client.emit('join-post-room', postId.toString());
    }

    await new Promise(r => setTimeout(r, 100));

    assert.ok(warningReceived, 'Should receive abuse-warning event from rate limiter');
    client.close();
  })();

  console.log('\n🎉 All Phase 4 Social Infrastructure verification tests passed!\n');
  server.close();
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal test execution error:', err);
  process.exit(1);
});
