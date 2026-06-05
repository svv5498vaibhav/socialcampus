const Post = require('../models/Post');
const User = require('../models/User');
const TrendingData = require('../models/TrendingData');
const View = require('../models/View');
const Notification = require('../models/Notification');
const { createAndSendNotification, notifyTrending } = require('./socketService');

class TrendingEngine {
  /**
   * Automatically calculates trending scores for all active posts and saves them.
   * Runs as a background task/cron job.
   */
  static async calculateTrends() {
    try {
      // 1. Fetch active posts in the last 48 hours to compute trends
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

      const posts = await Post.find({
        createdAt: { $gte: fortyEightHoursAgo },
        isSpam: false,
        isReported: false
      }).populate('authorId', 'branch college').lean();

      if (!posts || posts.length === 0) return;

      const postIds = posts.map(p => p._id);

      // 2. Fetch watch time & total view counts in the last 48 hours
      const viewStats = await View.aggregate([
        { $match: { postId: { $in: postIds }, createdAt: { $gte: fortyEightHoursAgo } } },
        { 
          $group: { 
            _id: '$postId', 
            totalWatchTime: { $sum: '$watchTime' },
            totalViews: { $sum: 1 }
          } 
        }
      ]);

      // 3. Fetch view counts in the last 6 hours to compute growth rate (velocity)
      const recentViewStats = await View.aggregate([
        { $match: { postId: { $in: postIds }, createdAt: { $gte: sixHoursAgo } } },
        { $group: { _id: '$postId', recentViews: { $sum: 1 } } }
      ]);

      const watchTimeMap = new Map();
      const totalViewsMap = new Map();
      viewStats.forEach(stat => {
        watchTimeMap.set(stat._id.toString(), stat.totalWatchTime);
        totalViewsMap.set(stat._id.toString(), stat.totalViews);
      });

      const recentViewsMap = new Map();
      recentViewStats.forEach(stat => {
        recentViewsMap.set(stat._id.toString(), stat.recentViews);
      });

      // Clear existing trending data
      await TrendingData.deleteMany({});

      const trendingEntries = [];

      for (const post of posts) {
        const postIdStr = post._id.toString();
        const likes = post.likesCount || 0;
        const comments = post.commentsCount || 0;
        const saves = post.savesCount || 0;
        const shares = post.sharesCount || 0;
        
        const totalViews = totalViewsMap.get(postIdStr) || 0;
        const recentViews = recentViewsMap.get(postIdStr) || 0;
        const watchTime = watchTimeMap.get(postIdStr) || 0;

        // Calculate Growth Velocity Rate:
        // Compares views in the last 6 hours to the average views per 6 hours in the older 42 hours.
        const olderViews = Math.max(totalViews - recentViews, 0);
        const olderViewsNormalized = olderViews / 7; // 42 hours / 6 hours = 7 intervals
        
        // Growth rate: ratio of recent frequency to historical frequency
        const growthRate = (recentViews + 1) / (olderViewsNormalized + 1);

        // Trending base score (weighted interactions)
        const rawEngagement = (likes * 3) + (comments * 6) + (saves * 5) + (shares * 8) + (watchTime * 0.15);
        
        // Time decay (gravity = 1.25)
        const ageHours = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
        
        // Final Trending Score combining base engagement, age decay, and growth velocity rate
        const trendingScore = (rawEngagement * growthRate) / Math.pow(ageHours + 2, 1.25);

        if (trendingScore > 0.3) {
          // A. Global Trend Entry
          trendingEntries.push({
            postId: post._id,
            trendingScore,
            scope: 'global',
            scopeValue: 'global',
            createdAt: new Date()
          });

          // B. Branch Trend Entry
          if (post.authorId && post.authorId.branch) {
            trendingEntries.push({
              postId: post._id,
              trendingScore,
              scope: 'branch',
              scopeValue: post.authorId.branch,
              createdAt: new Date()
            });
          }

          // C. College Trend Entry
          if (post.authorId && post.authorId.college) {
            trendingEntries.push({
              postId: post._id,
              trendingScore,
              scope: 'college',
              scopeValue: post.authorId.college,
              createdAt: new Date()
            });
          }
        }
      }

      // 3. Save calculations
      if (trendingEntries.length > 0) {
        await TrendingData.insertMany(trendingEntries);
      }

      console.log(`[TrendingEngine] Computed velocity trends for ${posts.length} posts. Generated ${trendingEntries.length} scope entries.`);

      // Broadcast new trends globally
      const topGlobalTrends = await TrendingEngine.getTrendingPosts('global', 'global', 10);
      notifyTrending(topGlobalTrends);

    } catch (error) {
      console.error('Error in trending engine calculations:', error);
    }
  }

  /**
   * Retrieves trending posts for a specific scope.
   */
  static async getTrendingPosts(scope = 'global', scopeValue = 'global', limit = 10) {
    try {
      const trendingItems = await TrendingData.find({ scope, scopeValue })
        .sort({ trendingScore: -1 })
        .limit(limit)
        .populate({
          path: 'postId',
          populate: { path: 'authorId', select: 'firstName lastName college branch semester' }
        })
        .lean();

      // Return posts, filtering out potential nulls
      return trendingItems
        .map(item => item.postId)
        .filter(post => post && !post.isSpam && !post.isReported);
    } catch (error) {
      console.error('Error in getTrendingPosts:', error);
      return [];
    }
  }

  /**
   * Recalculates trending score for a single post on engagement increment.
   */
  static async updatePostTrendingScore(postId) {
    try {
      const post = await Post.findById(postId).populate('authorId', 'branch college').lean();
      if (!post || post.isSpam || post.isReported) return;

      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

      // Fetch views & watchTime in the last 48 hours for this post
      const viewStats = await View.aggregate([
        { $match: { postId: post._id, createdAt: { $gte: fortyEightHoursAgo } } },
        { 
          $group: { 
            _id: '$postId', 
            totalWatchTime: { $sum: '$watchTime' },
            totalViews: { $sum: 1 }
          } 
        }
      ]);

      // Fetch recent views in the last 6 hours
      const recentViewStats = await View.aggregate([
        { $match: { postId: post._id, createdAt: { $gte: sixHoursAgo } } },
        { $group: { _id: '$postId', recentViews: { $sum: 1 } } }
      ]);

      const totalViews = viewStats.length > 0 ? viewStats[0].totalViews : 0;
      const recentViews = recentViewStats.length > 0 ? recentViewStats[0].recentViews : 0;
      const watchTime = viewStats.length > 0 ? viewStats[0].totalWatchTime : 0;

      const olderViews = Math.max(totalViews - recentViews, 0);
      const olderViewsNormalized = olderViews / 7; 
      const growthRate = (recentViews + 1) / (olderViewsNormalized + 1);

      const likes = post.likesCount || 0;
      const comments = post.commentsCount || 0;
      const saves = post.savesCount || 0;
      const shares = post.sharesCount || 0;

      const rawEngagement = (likes * 3) + (comments * 6) + (saves * 5) + (shares * 8) + (watchTime * 0.15);
      const ageHours = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
      const trendingScore = (rawEngagement * growthRate) / Math.pow(ageHours + 2, 1.25);

      // Delete existing entries for this post
      await TrendingData.deleteMany({ postId: post._id });

      if (trendingScore > 0.3) {
        const trendingEntries = [
          {
            postId: post._id,
            trendingScore,
            scope: 'global',
            scopeValue: 'global',
            createdAt: new Date()
          }
        ];

        if (post.authorId && post.authorId.branch) {
          trendingEntries.push({
            postId: post._id,
            trendingScore,
            scope: 'branch',
            scopeValue: post.authorId.branch,
            createdAt: new Date()
          });
        }

        if (post.authorId && post.authorId.college) {
          trendingEntries.push({
            postId: post._id,
            trendingScore,
            scope: 'college',
            scopeValue: post.authorId.college,
            createdAt: new Date()
          });
        }

        await TrendingData.insertMany(trendingEntries);

        // Notify author if newly trending
        if (post.authorId) {
          const authorId = post.authorId._id || post.authorId;
          const existingNotif = await Notification.findOne({ recipientId: authorId, type: 'trending', postId: post._id });
          if (!existingNotif) {
            await createAndSendNotification(
              authorId,
              null,
              'trending',
              post._id,
              'Post Trending! 🔥',
              `Your post "${post.title ? post.title.substring(0, 30) : ''}..." is trending on campus!`
            );
          }
        }
      }

      // Broadcast updated global trends
      const topGlobalTrends = await TrendingEngine.getTrendingPosts('global', 'global', 10);
      notifyTrending(topGlobalTrends);

    } catch (error) {
      console.error(`Error updating trending score for post ${postId}:`, error);
    }
  }
}

module.exports = TrendingEngine;
