const AnonymousPost = require('../models/AnonymousPost');

class AnonymousPostRepository {
  /**
   * Create a new anonymous post
   */
  static async create(postData) {
    return await AnonymousPost.create(postData);
  }

  /**
   * Find post by ID
   */
  static async findById(postId) {
    return await AnonymousPost.findById(postId);
  }

  /**
   * Find paginated posts matching query filters (only show safe or review_required depending on settings)
   */
  static async findFeed({ category, type, sort = 'newest', page = 1, limit = 10 }) {
    const filter = { isViewable: true, moderationStatus: { $ne: 'blocked' } };
    
    if (category) {
      filter.category = category;
    }
    if (type) {
      filter.type = type;
    }

    const skip = (page - 1) * limit;
    
    let sortObj = { createdAt: -1 };
    if (sort === 'popular') {
      sortObj = { reportsCount: 1, createdAt: -1 }; // least reported first
    } else if (sort === 'critical') {
      sortObj = { priority: -1, createdAt: -1 }; // critical first (need custom sorting priority mapped or string sort order)
    }

    const [posts, total] = await Promise.all([
      AnonymousPost.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      AnonymousPost.countDocuments(filter),
    ]);

    // Format sort critical priority ordering if requested
    if (sort === 'critical') {
      const priorityWeights = { critical: 4, high: 3, medium: 2, low: 1 };
      posts.sort((a, b) => {
        const wA = priorityWeights[a.priority] || 0;
        const wB = priorityWeights[b.priority] || 0;
        if (wA !== wB) return wB - wA;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    }

    return { posts, total, page, limit };
  }

  /**
   * Increment report count
   */
  static async incrementReports(postId) {
    return await AnonymousPost.findByIdAndUpdate(
      postId,
      { $inc: { reportsCount: 1 } },
      { new: true }
    );
  }

  /**
   * Update moderation status
   */
  static async updateModerationStatus(postId, status, flags = []) {
    return await AnonymousPost.findByIdAndUpdate(
      postId,
      { 
        $set: { 
          moderationStatus: status, 
          moderationFlags: flags,
          isViewable: status !== 'blocked'
        } 
      },
      { new: true }
    );
  }

  /**
   * Find recent posts by user hash (to check limits/abuse in hours window)
   */
  static async findRecentPostsByUserHash(userHash, hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const filter = { createdAt: { $gte: since } };
    if (userHash !== null && userHash !== undefined) {
      filter.hashedStudentId = userHash;
    }
    return await AnonymousPost.find(filter).lean();
  }

  /**
   * Soft delete/hide post
   */
  static async softDelete(postId) {
    return await AnonymousPost.findByIdAndUpdate(
      postId,
      { $set: { isViewable: false } },
      { new: true }
    );
  }

  /**
   * Get post counts grouped by category for trending analysis
   */
  static async getCategoryDistribution(sinceDate) {
    const filter = { moderationStatus: { $ne: 'blocked' } };
    if (sinceDate) {
      filter.createdAt = { $gte: sinceDate };
    }

    return await AnonymousPost.aggregate([
      { $match: filter },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
  }

  /**
   * Get average sentiment scores grouped by category
   */
  static async getSentimentByCategories() {
    return await AnonymousPost.aggregate([
      { $match: { moderationStatus: { $ne: 'blocked' } } },
      {
        $group: {
          _id: '$category',
          avgSentimentScore: { $avg: '$sentimentScore' },
          positiveCount: { $sum: { $cond: [{ $eq: ['$sentiment', 'positive'] }, 1, 0] } },
          neutralCount: { $sum: { $cond: [{ $eq: ['$sentiment', 'neutral'] }, 1, 0] } },
          negativeCount: { $sum: { $cond: [{ $eq: ['$sentiment', 'negative'] }, 1, 0] } },
          total: { $sum: 1 }
        }
      }
    ]);
  }
}

module.exports = AnonymousPostRepository;
