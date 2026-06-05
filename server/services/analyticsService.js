const View = require('../models/View');
const Post = require('../models/Post');
const mongoose = require('mongoose');

class AnalyticsService {
  /**
   * Tracks a post view event.
   * 
   * @param {string} postId 
   * @param {string} userId - can be undefined for anonymous views
   * @param {number} watchTime - watch time in seconds
   */
  static async trackView(postId, userId = null, watchTime = 0) {
    try {
      // Find or create view entry for unique reach calculation
      let view = null;
      if (userId) {
        view = await View.findOne({ postId, userId });
      }

      if (view) {
        // If view exists, increment watchTime
        view.watchTime += watchTime;
        await view.save();
      } else {
        // Create new view entry
        view = await View.create({
          postId,
          userId,
          watchTime
        });

        // Increment viewsCount in Post document
        await Post.findByIdAndUpdate(postId, { $inc: { viewsCount: 1 } });
      }

      return view;
    } catch (error) {
      console.error('Error in trackView analytics:', error);
    }
  }

  /**
   * Generates creator statistics for all posts authored by a user.
   * 
   * @param {string} authorId - ID of the creator
   * @returns {Promise<object>} creator analytics metrics
   */
  static async getCreatorAnalytics(authorId) {
    try {
      const authorObjectId = new mongoose.Types.ObjectId(authorId);

      // 1. Fetch all posts by this author
      const posts = await Post.find({ authorId }).lean();
      if (!posts || posts.length === 0) {
        return {
          hasData: false,
          totalPosts: 0,
          totalImpressions: 0,
          totalReach: 0,
          totalEngagement: 0,
          averageWatchTime: 0,
          engagementRate: 0,
          topPosts: [],
          demographics: [],
          dailyStats: []
        };
      }

      const postIds = posts.map(p => p._id);

      // 2. Aggregate impressions & reach from View collection
      const viewAggregation = await View.aggregate([
        { $match: { postId: { $in: postIds } } },
        {
          $group: {
            _id: null,
            totalImpressions: { $sum: 1 },
            uniqueReach: { $addToSet: '$userId' },
            totalWatchTime: { $sum: '$watchTime' }
          }
        }
      ]);

      const totalImpressions = posts.reduce((sum, p) => sum + (p.viewsCount || 0), 0);
      const totalReach = viewAggregation[0] ? viewAggregation[0].uniqueReach.length : 0;
      const totalWatchTime = viewAggregation[0] ? viewAggregation[0].totalWatchTime : 0;
      const averageWatchTime = totalImpressions > 0 ? Math.round((totalWatchTime / totalImpressions) * 10) / 10 : 0;

      // 3. Compute Engagement totals
      const totalLikes = posts.reduce((sum, p) => sum + (p.likesCount || 0), 0);
      const totalComments = posts.reduce((sum, p) => sum + (p.commentsCount || 0), 0);
      const totalSaves = posts.reduce((sum, p) => sum + (p.savesCount || 0), 0);
      const totalShares = posts.reduce((sum, p) => sum + (p.sharesCount || 0), 0);
      const totalEngagement = totalLikes + totalComments + totalSaves + totalShares;

      // Rates %
      const engagementRate = totalImpressions > 0 ? Math.round((totalEngagement / totalImpressions) * 100 * 10) / 10 : 0;
      const saveRate = totalImpressions > 0 ? Math.round((totalSaves / totalImpressions) * 100 * 10) / 10 : 0;
      const shareRate = totalImpressions > 0 ? Math.round((totalShares / totalImpressions) * 100 * 10) / 10 : 0;

      // 4. Fetch top performing posts by engagement
      const topPosts = posts
        .map(p => ({
          id: p._id,
          title: p.title || p.content.substring(0, 30) + '...',
          type: p.type,
          views: p.viewsCount || 0,
          likes: p.likesCount || 0,
          comments: p.commentsCount || 0,
          saves: p.savesCount || 0,
          shares: p.sharesCount || 0,
          engagement: (p.likesCount || 0) + (p.commentsCount || 0) + (p.savesCount || 0) + (p.sharesCount || 0)
        }))
        .sort((a, b) => b.engagement - a.engagement)
        .slice(0, 5);

      // 5. Demographics (Reaching students from different branches)
      const demographicAggregation = await View.aggregate([
        { $match: { postId: { $in: postIds }, userId: { $ne: null } } },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $group: {
            _id: '$user.branch',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);

      const totalDemographics = demographicAggregation.reduce((sum, d) => sum + d.count, 0);
      const demographics = demographicAggregation.map(d => ({
        branch: d._id || 'Unknown',
        percentage: totalDemographics > 0 ? Math.round((d.count / totalDemographics) * 100) : 0
      }));

      // 6. Daily impressions over the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const dailyAggregation = await View.aggregate([
        { $match: { postId: { $in: postIds }, createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            impressions: { $sum: 1 },
            watchTime: { $sum: '$watchTime' }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      return {
        hasData: true,
        totalPosts: posts.length,
        totalImpressions,
        totalReach,
        totalEngagement,
        totalLikes,
        totalComments,
        totalSaves,
        totalShares,
        averageWatchTime,
        engagementRate,
        saveRate,
        shareRate,
        topPosts,
        demographics,
        dailyStats: dailyAggregation.map(d => ({
          date: d._id,
          impressions: d.impressions,
          watchTime: Math.round(d.watchTime)
        }))
      };

    } catch (error) {
      console.error('Error calculating creator analytics:', error);
      throw error;
    }
  }
}

module.exports = AnalyticsService;
