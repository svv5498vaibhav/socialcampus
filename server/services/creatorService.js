const ContentRepository = require('../repositories/contentRepository');
const ProjectRepository = require('../repositories/projectRepository');
const ContentHelperEngine = require('./contentHelperEngine');
const QualityEngine = require('./qualityEngine');

class CreatorService {
  // --- Project Showcases ---
  static async publishProject(userId, projectData) {
    const quality = QualityEngine.evaluateProject(projectData);
    
    const project = await ProjectRepository.createProject({
      ...projectData,
      userId,
      qualityScore: quality.qualityScore,
    });

    return { project, quality };
  }

  static async getProjectDetails(projectId) {
    await ProjectRepository.incrementViews(projectId);
    return await ProjectRepository.findById(projectId);
  }

  static async listProjects(filters = {}, page = 1, limit = 20) {
    return await ProjectRepository.listProjects(filters, page, limit);
  }

  // --- Content Posts ---
  static async publishContentPost(userId, postData) {
    const { title, content, type, mediaUrls = [], tags = [], category } = postData;

    // AI Assist: auto detect category if not supplied
    const finalCategory = category || ContentHelperEngine.detectCategory(title, content);

    // AI Assist: auto generate tags if empty
    const finalTags = tags.length > 0 ? tags : ContentHelperEngine.generateTags(title, content);

    // Evaluate Quality
    const quality = QualityEngine.evaluateContent(title, content, mediaUrls.length, finalTags.length);

    // Summarize
    const aiSummary = ContentHelperEngine.generateSummary(content);

    const post = await ContentRepository.createContentPost({
      authorId: userId,
      title,
      content,
      type,
      mediaUrls,
      tags: finalTags,
      category: finalCategory,
      qualityScore: quality.qualityScore,
      readabilityScore: quality.readabilityScore,
      completenessScore: quality.completenessScore,
      aiSuggestions: {
        grammarCorrections: ContentHelperEngine.correctGrammar(content),
        tagSuggestions: finalTags,
        captionSuggestions: ContentHelperEngine.generateCaptions(title, type, aiSummary),
        summary: aiSummary,
      },
      status: 'published',
    });

    // Upsert tags dynamically in DB catalog
    for (const tag of finalTags) {
      await ContentRepository.upsertTag(tag, type);
    }

    return post;
  }

  static async getContentPost(postId) {
    await ContentRepository.incrementContentViews(postId);
    
    // Increment view in analytics too
    const post = await ContentRepository.findContentPostById(postId);
    if (post) {
      await ContentRepository.trackEngagement(postId, post.authorId._id, { views: 1 });
      await ContentRepository.updateDailyAnalytics(postId, new Date(), { views: 1 });
    }
    
    return post;
  }

  static async listContentPosts(filters = {}, page = 1, limit = 20) {
    return await ContentRepository.listContentPosts(filters, page, limit);
  }

  // --- AI Writing Assistant (Helper) ---
  static getWritingAssistantTips(title, content, type) {
    const summary = ContentHelperEngine.generateSummary(content);
    const grammar = ContentHelperEngine.correctGrammar(content);
    const tags = ContentHelperEngine.generateTags(title, content);
    const category = ContentHelperEngine.detectCategory(title, content);
    const captions = ContentHelperEngine.generateCaptions(title, type, summary);

    return {
      category,
      tags,
      summary,
      grammarCorrections: grammar,
      captions,
    };
  }

  // --- Study Resources ---
  static async uploadResource(userId, data) {
    return await ContentRepository.createResource({
      ...data,
      uploadedBy: userId,
    });
  }

  static async downloadResource(resourceId) {
    await ContentRepository.incrementResourceDownload(resourceId);
    return await ContentRepository.findResourceById(resourceId);
  }

  static async listResources(filters = {}, page = 1, limit = 20) {
    return await ContentRepository.listResources(filters, page, limit);
  }

  // --- Engagement Tracking & Analytics ---
  static async trackPostHoverAndMetrics(postId, metrics) {
    const post = await ContentRepository.findContentPostById(postId);
    if (!post) throw new Error('Post not found');

    const authorId = post.authorId._id;
    return await ContentRepository.trackEngagement(postId, authorId, metrics);
  }

  static async incrementPostLike(postId) {
    const post = await ContentRepository.incrementContentLike(postId);
    if (post) {
      await ContentRepository.updateDailyAnalytics(postId, new Date(), { likes: 1 });
    }
    return post;
  }

  static async getCreatorDashboard(authorId) {
    const metrics = await ContentRepository.getCreatorAnalytics(authorId);
    const posts = await ContentRepository.listContentPosts({ authorId }, 1, 10);
    return {
      metrics,
      recentPosts: posts.docs,
    };
  }

  static async getPostAnalyticsDetails(postId) {
    return await ContentRepository.getPostAnalytics(postId);
  }
}

module.exports = CreatorService;
