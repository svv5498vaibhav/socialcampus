const Post = require('../models/Post');
const Like = require('../models/Like');
const Comment = require('../models/Comment');
const Save = require('../models/Save');
const Share = require('../models/Share');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Notification = require('../models/Notification');
const { cache } = require('../config/redis');
const ContentClassifier = require('./contentClassifier');
const QualityScoringEngine = require('./qualityScoringEngine');
const SpamDetector = require('./spamDetector');
const PostSummarizer = require('./postSummarizer');
const HashtagEngine = require('./hashtagEngine');
const FeedRankingEngine = require('./feedRankingEngine');
const TrendingEngine = require('./trendingEngine');
const { notifyEngagement, notifyNewPost, logActivity, createAndSendNotification } = require('./socketService');

class FeedService {
  /**
   * Creates a new post and runs full AI pipeline.
   */
  static async createPost(authorId, data = {}, userRole = 'student') {
    const { title, content, mediaUrls, metadata } = data;

    // 1. Run AI Post Categorizer
    const classifiedType = ContentClassifier.classify(title, content, metadata, userRole);

    // 2. Run AI Post Summarizer
    const aiSummary = PostSummarizer.summarize(title, content, classifiedType);

    // 3. Run Smart Hashtags Generator
    const hashtags = HashtagEngine.generate(title, content, classifiedType);

    // 4. Run Quality Scoring Engine
    const qualityScore = QualityScoringEngine.calculate(title, content, classifiedType, mediaUrls, metadata);

    // 5. Run Spam Detection Engine
    const spamResult = await SpamDetector.detectSpam(title, content, authorId);

    // 6. Assemble and save post
    const post = await Post.create({
      authorId,
      type: classifiedType,
      title: title || '',
      content,
      mediaUrls: mediaUrls || [],
      metadata: metadata || {},
      aiSummary,
      hashtags,
      qualityScore,
      spamScore: spamResult.spamScore,
      isSpam: spamResult.isSpam
    });

    // Populate author details
    const populatedPost = await Post.findById(post._id).populate('authorId', 'firstName lastName college branch semester role').lean();

    // 7. Push live Socket notification to clients (if not spam)
    if (!post.isSpam) {
      notifyNewPost(populatedPost);
      // Log activity
      await logActivity(authorId, 'create_post', post._id, { type: classifiedType });
      // Invalidate creator's feed cache
      await FeedService.clearUserFeedCache(authorId);
      // Parse mentions
      await FeedService.parseAndNotifyMentions(content, post._id, authorId);
    }

    return populatedPost;
  }

  /**
   * Toggles (like / unlike) a post.
   */
  static async toggleLike(postId, userId) {
    const existingLike = await Like.findOne({ postId, userId });
    let isLiked = false;

    if (existingLike) {
      // Unlike
      await Like.deleteOne({ _id: existingLike._id });
      await Post.findByIdAndUpdate(postId, { $inc: { likesCount: -1 } });
    } else {
      // Like
      await Like.create({ postId, userId });
      const postDetail = await Post.findByIdAndUpdate(postId, { $inc: { likesCount: 1 } });
      isLiked = true;

      // Log Activity
      await logActivity(userId, 'like_post', postId);

      // Send Real-Time Notification
      if (postDetail && postDetail.authorId.toString() !== userId.toString()) {
        const user = await User.findById(userId).lean();
        await createAndSendNotification(
          postDetail.authorId,
          userId,
          'like',
          postId,
          'New Like! 👍',
          `${user.firstName} ${user.lastName} liked your post.`
        );
      }
    }

    // Recalculate trending score in real-time
    TrendingEngine.updatePostTrendingScore(postId).catch(err => console.error('Trending update error:', err));

    // Load fresh counters
    const post = await Post.findById(postId).select('likesCount commentsCount sharesCount savesCount').lean();
    if (post) {
      notifyEngagement(postId, post);
    }

    return { isLiked, metrics: post };
  }

  /**
   * Submits a comment.
   */
  static async addComment(postId, userId, content) {
    const comment = await Comment.create({ postId, userId, content });
    await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });

    // Load populated comment
    const populatedComment = await Comment.findById(comment._id).populate('userId', 'firstName lastName').lean();

    // Log Activity
    await logActivity(userId, 'comment_post', postId, { commentId: comment._id });

    // Parse mentions and send notifications
    await FeedService.parseAndNotifyMentions(content, postId, userId);

    // Send Real-Time Notification
    const postDetail = await Post.findById(postId).select('authorId').lean();
    if (postDetail && postDetail.authorId.toString() !== userId.toString()) {
      const user = await User.findById(userId).lean();
      await createAndSendNotification(
        postDetail.authorId,
        userId,
        'comment',
        postId,
        'New Comment! 💬',
        `${user.firstName} ${user.lastName} commented on your post: "${content.substring(0, 30)}..."`
      );
    }

    // Recalculate trending score in real-time
    TrendingEngine.updatePostTrendingScore(postId).catch(err => console.error('Trending update error:', err));

    // Push live Socket updates
    const post = await Post.findById(postId).select('likesCount commentsCount sharesCount savesCount').lean();
    if (post) {
      notifyEngagement(postId, post);
    }

    return { comment: populatedComment, metrics: post };
  }

  /**
   * Toggles (save / unsave) bookmark.
   */
  static async toggleSave(postId, userId) {
    const existingSave = await Save.findOne({ postId, userId });
    let isSaved = false;

    if (existingSave) {
      // Unsave
      await Save.deleteOne({ _id: existingSave._id });
      await Post.findByIdAndUpdate(postId, { $inc: { savesCount: -1 } });
    } else {
      // Save
      await Save.create({ postId, userId });
      await Post.findByIdAndUpdate(postId, { $inc: { savesCount: 1 } });
      isSaved = true;

      // Log Activity
      await logActivity(userId, 'save_post', postId);
    }

    // Recalculate trending score in real-time
    TrendingEngine.updatePostTrendingScore(postId).catch(err => console.error('Trending update error:', err));

    // Push live Socket updates
    const post = await Post.findById(postId).select('likesCount commentsCount sharesCount savesCount').lean();
    if (post) {
      notifyEngagement(postId, post);
    }

    return { isSaved, metrics: post };
  }

  /**
   * Registers a share event.
   */
  static async registerShare(postId, userId, platform = 'internal') {
    await Share.create({ postId, userId, platform });
    await Post.findByIdAndUpdate(postId, { $inc: { sharesCount: 1 } });

    // Log Activity
    await logActivity(userId, 'share_post', postId, { platform });

    // Recalculate trending score in real-time
    TrendingEngine.updatePostTrendingScore(postId).catch(err => console.error('Trending update error:', err));

    // Push live Socket updates
    const post = await Post.findById(postId).select('likesCount commentsCount sharesCount savesCount').lean();
    if (post) {
      notifyEngagement(postId, post);
    }

    return { metrics: post };
  }

  /**
   * Fetches compiled feed based on user and tab selected.
   */
  static async getFeed(userId, tab = 'for-you', page = 1, limit = 10) {
    const user = await User.findById(userId).lean();
    if (!user) throw new Error('User not found');

    // 1. Resolve cache key based on tab scope
    let cacheKey = '';
    const cacheTTL = 60; // 60 seconds

    if (tab === 'for-you' || tab === 'following') {
      cacheKey = `feed:cache:user:${userId}:tab:${tab}:page:${page}`;
    } else if (tab === 'branch') {
      cacheKey = `feed:cache:branch:${user.branch || 'unknown'}:page:${page}`;
    } else if (tab === 'trending') {
      cacheKey = `feed:cache:trending:${user.branch || 'global'}:page:${page}`;
    } else {
      // projects, internships, events
      cacheKey = `feed:cache:global:tab:${tab}:page:${page}`;
    }

    // 2. Check cache
    try {
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        console.log(`⚡ Feed Cache HIT for key: ${cacheKey}`);
        return JSON.parse(cachedData);
      }
    } catch (err) {
      console.warn('Feed Cache read error:', err.message);
    }

    // 3. Compute feed (original logic)
    const skip = (page - 1) * limit;
    const profile = await Profile.findOne({ userId }).lean();

    let query = { isSpam: false, isReported: false };
    let sortOption = { createdAt: -1 };
    let result = null;

    switch (tab) {
      case 'for-you':
        const recentPosts = await Post.find(query)
          .sort({ createdAt: -1 })
          .limit(100)
          .populate('authorId', 'firstName lastName college branch semester role')
          .lean();
        const ranked = await FeedRankingEngine.rankPosts(userId, recentPosts);
        const paginatedRanked = ranked.slice(skip, skip + limit);
        result = {
          posts: paginatedRanked,
          hasMore: ranked.length > skip + limit
        };
        break;

      case 'following':
        const followingIds = profile ? profile.following || [] : [];
        query.authorId = { $in: followingIds };
        break;

      case 'branch':
        const branchUsers = await User.find({ branch: user.branch }).select('_id').lean();
        const userIdsInBranch = branchUsers.map(bu => bu._id);
        query.authorId = { $in: userIdsInBranch };
        break;

      case 'trending':
        const trendingPosts = await TrendingEngine.getTrendingPosts('global', 'global', 50);
        const paginatedTrending = trendingPosts.slice(skip, skip + limit);
        result = {
          posts: paginatedTrending,
          hasMore: trendingPosts.length > skip + limit
        };
        break;

      case 'projects':
        query.type = 'project';
        break;

      case 'internships':
        query.type = 'internship';
        break;

      case 'events':
        query.type = 'event';
        break;

      default:
        break;
    }

    if (!result) {
      const posts = await Post.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limit + 1)
        .populate('authorId', 'firstName lastName college branch semester role')
        .lean();

      const hasMore = posts.length > limit;
      if (hasMore) posts.pop();

      result = {
        posts,
        hasMore
      };
    }

    // 4. Save to Cache
    try {
      await cache.set(cacheKey, JSON.stringify(result), cacheTTL);
      console.log(`💾 Saved feed to Cache key: ${cacheKey}`);
    } catch (err) {
      console.warn('Feed Cache write error:', err.message);
    }

    return result;
  }

  /**
   * Fetches comment threads.
   */
  static async getComments(postId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const comments = await Comment.find({ postId })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'firstName lastName')
      .lean();

    return comments;
  }

  /**
   * Records a vote on a poll option.
   */
  static async votePoll(postId, optionIndex, userId) {
    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found');
    if (post.type !== 'poll') throw new Error('Post is not a poll');
    if (!post.metadata || (!post.metadata.pollOptions && !post.metadata.options)) throw new Error('Poll options not found');

    const options = post.metadata.pollOptions || post.metadata.options;
    
    // Remove user's vote from any other option in this poll first
    options.forEach(opt => {
      opt.votes = (opt.votes || []).filter(v => v.toString() !== userId.toString());
    });

    // Add user's vote to the selected option
    if (!options[optionIndex].votes) {
      options[optionIndex].votes = [];
    }
    options[optionIndex].votes.push(userId);
    post.markModified('metadata');
    await post.save();

    // Log Activity
    await logActivity(userId, 'vote_poll', postId, { optionIndex });

    // Push live Socket updates
    notifyEngagement(postId, { 
      likesCount: post.likesCount, 
      commentsCount: post.commentsCount, 
      sharesCount: post.sharesCount, 
      savesCount: post.savesCount,
      metadata: post.metadata
    });

    return post;
  }

  /**
   * Clears the user's personal feed cache (first 5 pages).
   */
  static async clearUserFeedCache(userId) {
    try {
      for (let page = 1; page <= 5; page++) {
        await cache.del(`feed:cache:user:${userId}:tab:for-you:page:${page}`);
        await cache.del(`feed:cache:user:${userId}:tab:following:page:${page}`);
      }
      console.log(`🧹 Invalidated feed cache for user: ${userId}`);
    } catch (err) {
      console.error('Error clearing user feed cache:', err.message);
    }
  }

  /**
   * Scans content for @username and notifies matching users.
   */
  static async parseAndNotifyMentions(content, postId, senderId) {
    try {
      if (!content) return;
      const matches = content.match(/@([a-z0-9_]{3,30})/gi);
      if (!matches) return;

      const usernames = matches.map(m => m.substring(1).toLowerCase());
      const uniqueUsernames = [...new Set(usernames)];

      const matchedProfiles = await Profile.find({ username: { $in: uniqueUsernames } }).select('userId').populate('userId', 'firstName lastName').lean();
      const sender = await User.findById(senderId).select('firstName lastName').lean();
      const senderName = sender ? `${sender.firstName} ${sender.lastName}` : 'Someone';

      for (const profile of matchedProfiles) {
        if (!profile.userId) continue;
        const recipientId = profile.userId._id;
        if (recipientId.toString() === senderId.toString()) continue;

        await createAndSendNotification(
          recipientId,
          senderId,
          'mention',
          postId,
          'Mentioned! 🏷️',
          `${senderName} mentioned you in a post/comment.`
        );
      }
    } catch (err) {
      console.error('Error parsing and notifying mentions:', err.message);
    }
  }

  /**
   * Retrieves notifications history for a user.
   */
  static async getNotifications(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    return await Notification.find({ recipientId: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('senderId', 'firstName lastName')
      .lean();
  }

  /**
   * Retrieves unread notifications count, reading from Redis cache if available.
   */
  static async getUnreadNotificationCount(userId) {
    const cacheKey = `notifications:unread:${userId}`;
    try {
      const cachedCount = await cache.get(cacheKey);
      if (cachedCount !== null && cachedCount !== undefined) {
        return parseInt(cachedCount, 10);
      }
    } catch (err) {
      console.warn('Unread count cache read error:', err.message);
    }

    const count = await Notification.countDocuments({ recipientId: userId, isRead: false });

    try {
      await cache.set(cacheKey, String(count), 86400); // 24 hours TTL
    } catch (err) {
      console.warn('Unread count cache write error:', err.message);
    }

    return count;
  }

  /**
   * Marks notifications as read.
   */
  static async markNotificationsAsRead(userId, notificationId = null) {
    const query = { recipientId: userId };
    if (notificationId) {
      query._id = notificationId;
    } else {
      query.isRead = false;
    }

    await Notification.updateMany(query, { isRead: true });

    // Invalidate count cache
    try {
      await cache.del(`notifications:unread:${userId}`);
    } catch (err) {
      console.warn('Unread count cache del error:', err.message);
    }

    return { success: true };
  }
}

module.exports = FeedService;
