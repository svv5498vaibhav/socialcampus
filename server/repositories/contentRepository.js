const Resource = require('../models/Resource');
const ContentPost = require('../models/ContentPost');
const ContentAnalytics = require('../models/ContentAnalytics');
const ContentCategory = require('../models/ContentCategory');
const Tag = require('../models/Tag');

class ContentRepository {
  // --- Resources ---
  static async createResource(data) {
    const resource = new Resource(data);
    await resource.save();
    return resource;
  }

  static async findResourceById(id) {
    return await Resource.findById(id).populate('uploadedBy', 'firstName lastName').lean();
  }

  static async listResources(filters = {}, page = 1, limit = 20) {
    const query = {};
    if (filters.type) query.type = filters.type;
    if (filters.category) query.category = filters.category;
    if (filters.uploadedBy) query.uploadedBy = filters.uploadedBy;
    if (filters.search) {
      query.$or = [
        { title: new RegExp(filters.search, 'i') },
        { description: new RegExp(filters.search, 'i') }
      ];
    }

    const skip = (page - 1) * limit;
    const docs = await Resource.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('uploadedBy', 'firstName lastName branch semester')
      .lean();

    const total = await Resource.countDocuments(query);
    return { docs, total, page, limit };
  }

  static async incrementResourceDownload(resourceId) {
    return await Resource.findByIdAndUpdate(resourceId, { $inc: { downloadsCount: 1 } }, { new: true });
  }

  static async incrementResourceLike(resourceId) {
    return await Resource.findByIdAndUpdate(resourceId, { $inc: { likesCount: 1 } }, { new: true });
  }

  // --- Content Posts ---
  static async createContentPost(data) {
    const post = new ContentPost(data);
    await post.save();
    return post;
  }

  static async findContentPostById(id) {
    return await ContentPost.findById(id).populate('authorId', 'firstName lastName email branch semester').lean();
  }

  static async listContentPosts(filters = {}, page = 1, limit = 20) {
    const query = {};
    if (filters.authorId) query.authorId = filters.authorId;
    if (filters.type) query.type = filters.type;
    if (filters.category) query.category = filters.category;
    if (filters.status) query.status = filters.status;
    if (filters.tag) query.tags = filters.tag;
    if (filters.search) {
      query.$or = [
        { title: new RegExp(filters.search, 'i') },
        { content: new RegExp(filters.search, 'i') }
      ];
    }

    const skip = (page - 1) * limit;
    const docs = await ContentPost.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('authorId', 'firstName lastName branch semester')
      .lean();

    const total = await ContentPost.countDocuments(query);
    return { docs, total, page, limit };
  }

  static async updateContentPostScore(postId, scores) {
    return await ContentPost.findByIdAndUpdate(
      postId,
      {
        $set: {
          qualityScore: scores.qualityScore,
          readabilityScore: scores.readabilityScore,
          completenessScore: scores.completenessScore,
          aiSuggestions: scores.aiSuggestions,
        },
      },
      { new: true }
    );
  }

  static async incrementContentLike(postId) {
    return await ContentPost.findByIdAndUpdate(postId, { $inc: { likesCount: 1 } }, { new: true });
  }

  static async incrementContentViews(postId) {
    return await ContentPost.findByIdAndUpdate(postId, { $inc: { viewsCount: 1 } }, { new: true });
  }

  // --- Tags ---
  static async upsertTag(name, type = 'general') {
    const tagName = name.toLowerCase().trim();
    return await Tag.findOneAndUpdate(
      { name: tagName },
      { $setOnInsert: { type }, $inc: { usageCount: 1 } },
      { upsert: true, new: true }
    );
  }

  static async listTags(type = null, limit = 50) {
    const query = type ? { type } : {};
    return await Tag.find(query).sort({ usageCount: -1 }).limit(limit).lean();
  }

  // --- Categories ---
  static async createCategory(data) {
    const category = new ContentCategory(data);
    await category.save();
    return category;
  }

  static async listCategories() {
    return await ContentCategory.find({ isActive: true }).sort({ name: 1 }).lean();
  }

  // --- Analytics ---
  static async trackEngagement(postId, authorId, metrics) {
    const update = {
      $inc: {
        views: metrics.views || 0,
        clicks: metrics.clicks || 0,
        uniqueVisitors: metrics.uniqueVisitor ? 1 : 0,
      },
    };

    // Calculate moving average for reading duration and scroll depth
    const existing = await ContentAnalytics.findOne({ postId }).lean();
    if (existing) {
      if (metrics.readingDurationMs) {
        const totalDuration = existing.avgReadingDurationMs * existing.views + metrics.readingDurationMs;
        const newViews = existing.views + (metrics.views || 1);
        update.$set = update.$set || {};
        update.$set.avgReadingDurationMs = Math.round(totalDuration / newViews);
      }
      if (metrics.scrollDepthPercent) {
        const totalScroll = existing.avgScrollDepthPercent * existing.views + metrics.scrollDepthPercent;
        const newViews = existing.views + (metrics.views || 1);
        update.$set = update.$set || {};
        update.$set.avgScrollDepthPercent = Math.round(totalScroll / newViews);
      }
      if (metrics.hover) {
        const currentHovers = existing.hoverMetrics.totalHovers;
        const currentAvg = existing.hoverMetrics.avgHoverDurationMs;
        const totalHoverDuration = currentAvg * currentHovers + (metrics.hoverDurationMs || 0);
        const newHovers = currentHovers + 1;
        update.$set = update.$set || {};
        update.$set['hoverMetrics.totalHovers'] = newHovers;
        update.$set['hoverMetrics.avgHoverDurationMs'] = Math.round(totalHoverDuration / newHovers);
      }
    } else {
      update.$setOnInsert = {
        authorId,
        avgReadingDurationMs: metrics.readingDurationMs || 0,
        avgScrollDepthPercent: metrics.scrollDepthPercent || 0,
        'hoverMetrics.totalHovers': metrics.hover ? 1 : 0,
        'hoverMetrics.avgHoverDurationMs': metrics.hover ? (metrics.hoverDurationMs || 0) : 0,
      };
    }

    // Keep daily metrics records
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await ContentAnalytics.findOneAndUpdate(
      { postId },
      update,
      { upsert: true, new: true }
    );
  }

  static async updateDailyAnalytics(postId, date, incFields) {
    // incFields = { views, clicks, likes, comments }
    const formattedDate = new Date(date);
    formattedDate.setHours(0,0,0,0);

    const filter = { postId, 'dailyMetrics.date': formattedDate };
    const exists = await ContentAnalytics.findOne(filter).lean();

    if (exists) {
      const incUpdate = {};
      for (const [key, val] of Object.entries(incFields)) {
        incUpdate[`dailyMetrics.$.${key}`] = val;
      }
      return await ContentAnalytics.findOneAndUpdate(filter, { $inc: incUpdate }, { new: true });
    } else {
      const pushObj = { date: formattedDate, views: 0, clicks: 0, likes: 0, comments: 0, ...incFields };
      return await ContentAnalytics.findOneAndUpdate(
        { postId },
        { $push: { dailyMetrics: pushObj } },
        { new: true }
      );
    }
  }

  static async getPostAnalytics(postId) {
    return await ContentAnalytics.findOne({ postId }).populate('postId').lean();
  }

  static async getCreatorAnalytics(authorId) {
    const records = await ContentAnalytics.find({ authorId }).lean();
    const summary = {
      totalViews: 0,
      totalClicks: 0,
      totalUniqueVisitors: 0,
      avgReadingDurationMs: 0,
      avgScrollDepthPercent: 0,
      postsTracked: records.length,
    };

    if (records.length === 0) return summary;

    let durationSum = 0;
    let scrollSum = 0;

    for (const r of records) {
      summary.totalViews += r.views;
      summary.totalClicks += r.clicks;
      summary.totalUniqueVisitors += r.uniqueVisitors;
      durationSum += r.avgReadingDurationMs;
      scrollSum += r.avgScrollDepthPercent;
    }

    summary.avgReadingDurationMs = Math.round(durationSum / records.length);
    summary.avgScrollDepthPercent = Math.round(scrollSum / records.length);
    return summary;
  }
}

module.exports = ContentRepository;
