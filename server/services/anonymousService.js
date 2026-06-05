const crypto = require('crypto');
const AnonymousPostRepository = require('../repositories/anonymousPostRepository');
const ReportRepository = require('../repositories/reportRepository');
const ModerationRepository = require('../repositories/moderationRepository');

// AI Engines
const ToxicityEngine = require('./toxicityEngine');
const SentimentEngine = require('./sentimentEngine');
const SpamEngine = require('./spamEngine');
const CategoryEngine = require('./categoryEngine');
const PriorityEngine = require('./priorityEngine');
const CommunityHealthEngine = require('./communityHealthEngine');

// Real-time Socket
const { getIO } = require('./socketService');

class AnonymousService {
  /**
   * Helper to generate a daily-rotating HMAC-SHA256 hash of a student's ID
   */
  static getStudentHash(studentId) {
    const todayStr = new Date().toISOString().split('T')[0];
    const secret = process.env.SAFEVOICE_SECRET || 'campusx_safevoice_super_secret_123';
    // daily key rotation appended to salt to protect cross-day linkability
    const salt = secret + '-' + todayStr;
    return crypto.createHmac('sha256', salt).update(studentId.toString()).digest('hex');
  }

  /**
   * Create an anonymous post with full pipeline checks
   */
  static async createPost(userId, content, type, ipAddress = null) {
    const studentHash = AnonymousService.getStudentHash(userId);
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Check Rate Limits (max 5 posts per day per user hash)
    const recentUserPosts = await AnonymousPostRepository.findRecentPostsByUserHash(studentHash, 24);
    if (recentUserPosts.length >= 5) {
      throw new Error('Daily limit of 5 anonymous posts reached. Please try again tomorrow.');
    }

    // 2. Spam Similarity Check (Compare against all recent posts in the last 1 hour)
    const recentFeedPosts = await AnonymousPostRepository.findRecentPostsByUserHash(null, 1);
    // filter out current user posts if we want, but spam engine checks all posts for duplicate complaints
    const spamCheck = SpamEngine.evaluate(content, recentFeedPosts, 0.8);
    if (spamCheck.isSpam) {
      // Log spam attempt
      await ModerationRepository.logTrustSafetyEvent({
        action: 'spam_blocked',
        userIdHash: studentHash,
        metadata: { similarity: spamCheck.similarity, reason: 'duplicate_complaint' },
        ipAddress,
      });
      throw new Error('Your post matches a recent submission. Duplicate complaints are automatically blocked to prevent spam.');
    }

    // 3. AI Moderation & Toxicity Checks
    const toxicity = ToxicityEngine.evaluate(content);
    
    // 4. Category Classification
    const category = CategoryEngine.classify(content);

    // 5. Sentiment Analysis
    const sentimentObj = SentimentEngine.analyze(content);

    // 6. Priority Risk Assessment & Escalation Routing
    const risk = PriorityEngine.assess(content, type);

    // Build post document payload
    const postPayload = {
      hashedStudentId: studentHash,
      content,
      type,
      category,
      sentiment: sentimentObj.sentiment,
      sentimentScore: sentimentObj.score,
      priority: risk.priority,
      moderationStatus: toxicity.status,
      moderationFlags: toxicity.flags,
      isViewable: toxicity.status !== 'blocked',
    };

    const post = await AnonymousPostRepository.create(postPayload);

    // 7. Process Moderation States & Actions
    if (toxicity.status === 'blocked') {
      await ModerationRepository.logModerationAction({
        postId: post._id,
        action: 'blocked',
        reason: `Auto-blocked by AI: ${toxicity.flags.join(', ')}`,
        decisionSource: 'auto_moderator',
      });

      await ModerationRepository.logTrustSafetyEvent({
        action: 'content_blocked',
        userIdHash: studentHash,
        metadata: { postId: post._id, flags: toxicity.flags },
        ipAddress,
      });

      // Notify moderators via WebSockets
      try {
        const io = getIO();
        io.to('anonymous:moderators').emit('anonymous-moderation-alert', {
          action: 'blocked',
          post,
        });
      } catch (wsErr) {}

      throw new Error('Post blocked. Content contains toxic language, harassment, or profanity violating campus rules.');
    }

    if (toxicity.status === 'review_required') {
      await ModerationRepository.logModerationAction({
        postId: post._id,
        action: 'flagged',
        reason: `Flagged for review by AI: ${toxicity.flags.join(', ')}`,
        decisionSource: 'auto_moderator',
      });

      // Notify moderators via WebSockets
      try {
        const io = getIO();
        io.to('anonymous:moderators').emit('anonymous-moderation-alert', {
          action: 'review_required',
          post,
        });
      } catch (wsErr) {}
    }

    // 8. Handle critical escalation routing
    if (risk.priority === 'critical' && risk.escalation) {
      await ModerationRepository.createEscalation({
        postId: post._id,
        escalatedTo: risk.escalation.escalateTo,
        escalationReason: risk.escalation.reason,
      });

      await ModerationRepository.logModerationAction({
        postId: post._id,
        action: 'escalated',
        reason: `Escalated to ${risk.escalation.escalateTo}: ${risk.escalation.reason}`,
        decisionSource: 'auto_moderator',
      });

      // Real-time alert to Moderator Room
      try {
        const io = getIO();
        io.to('anonymous:moderators').emit('anonymous-escalation-alert', {
          postId: post._id,
          escalatedTo: risk.escalation.escalateTo,
          reason: risk.escalation.reason,
          content: post.content,
        });
      } catch (wsErr) {}
    }

    // 9. Push to real-time feed if post is safe
    if (post.moderationStatus === 'safe') {
      try {
        const io = getIO();
        io.to('anonymous:feed').emit('new-anonymous-post', {
          _id: post._id,
          content: post.content,
          type: post.type,
          category: post.category,
          sentiment: post.sentiment,
          priority: post.priority,
          createdAt: post.createdAt,
        });
      } catch (wsErr) {}
    }

    // 10. Recalculate daily health score asynchronously
    CommunityHealthEngine.calculateHealthScore(todayStr).catch(err =>
      console.error('Failed to recalculate community health score:', err.message)
    );

    return post;
  }

  /**
   * Submit an anonymous report on a post
   */
  static async reportPost(userId, postId, reason, details = '', ipAddress = null) {
    const reporterHash = AnonymousService.getStudentHash(userId);

    // Check duplicate reports
    const hasReported = await ReportRepository.hasUserReported(postId, reporterHash);
    if (hasReported) {
      throw new Error('You have already reported this post.');
    }

    const report = await ReportRepository.create({
      postId,
      reporterHash,
      reason,
      details,
    });

    // Increment report counter on the post
    const post = await AnonymousPostRepository.incrementReports(postId);

    // If report count reaches threshold (e.g. 5 reports), auto-hide post and queue for review
    if (post && post.reportsCount >= 5 && post.moderationStatus === 'safe') {
      await AnonymousPostRepository.updateModerationStatus(postId, 'review_required');
      await ModerationRepository.logModerationAction({
        postId,
        action: 'flagged',
        reason: 'Flagged automatically due to report threshold limit exceeded (>=5)',
        decisionSource: 'auto_moderator',
      });

      try {
        const io = getIO();
        io.to('anonymous:moderators').emit('anonymous-moderation-alert', {
          action: 'review_required',
          post,
        });
      } catch (wsErr) {}
    }

    // Notify admins via WebSocket
    try {
      const io = getIO();
      io.to('anonymous:moderators').emit('report-received', {
        report,
        reportsCount: post ? post.reportsCount : 1,
      });
    } catch (wsErr) {}

    // Recalculate health metrics
    const todayStr = new Date().toISOString().split('T')[0];
    CommunityHealthEngine.calculateHealthScore(todayStr).catch(err =>
      console.error('Failed to recalculate community health score:', err.message)
    );

    return report;
  }

  /**
   * Admin manual moderation override (approve or block post)
   */
  static async moderatePost(postId, adminId, status, reason) {
    if (status !== 'safe' && status !== 'blocked') {
      throw new Error("Invalid status update. Must be 'safe' or 'blocked'.");
    }

    const post = await AnonymousPostRepository.updateModerationStatus(postId, status);
    if (!post) {
      throw new Error('Post not found');
    }

    // Log the manual decision
    const action = status === 'safe' ? 'approved' : 'blocked';
    await ModerationRepository.logModerationAction({
      postId,
      action,
      reason,
      decisionSource: 'admin_manual',
      adminId,
    });

    // If blocked, auto-resolve all open reports
    if (status === 'blocked') {
      await ReportRepository.resolveAllForPost(postId, adminId, 'resolved');
    }

    // Notify clients about removal if blocked
    if (status === 'blocked') {
      try {
        const io = getIO();
        io.to('anonymous:feed').emit('anonymous-post-removed', { postId });
      } catch (wsErr) {}
    }

    // Recalculate health metrics
    const todayStr = new Date().toISOString().split('T')[0];
    CommunityHealthEngine.calculateHealthScore(todayStr).catch(err =>
      console.error('Failed to recalculate community health score:', err.message)
    );

    return post;
  }

  /**
   * Resolve an escalated concern (Admin action)
   */
  static async resolveEscalation(escalationId, adminId, notes) {
    const escalation = await ModerationRepository.resolveEscalation(escalationId, adminId, notes);
    if (!escalation) {
      throw new Error('Escalation record not found');
    }
    return escalation;
  }
}

module.exports = AnonymousService;
