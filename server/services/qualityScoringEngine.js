class QualityScoringEngine {
  /**
   * Calculates post quality score between 0 and 100.
   * 
   * @param {string} title 
   * @param {string} content 
   * @param {string} type 
   * @param {Array<string>} mediaUrls 
   * @param {object} metadata 
   * @returns {number} score from 0 to 100
   */
  static calculate(title = '', content = '', type = 'discussion', mediaUrls = [], metadata = {}) {
    let score = 0;

    // ── 1. Content Length & Formatting Heuristics (Max: 30 Points) ──
    const textLength = content.trim().length;
    if (textLength > 500) {
      score += 20; // Comprehensive post
    } else if (textLength > 200) {
      score += 15;
    } else if (textLength > 50) {
      score += 10;
    } else if (textLength > 10) {
      score += 5;
    }

    // Paragraph structure / Markdown formatting check
    const hasNewlines = content.includes('\n');
    const hasMarkdown = /[#*_\-`\[\]]/.test(content);
    if (hasNewlines) score += 5;
    if (hasMarkdown) score += 5;

    // ── 2. Media Presence (Max: 30 Points) ──
    if (mediaUrls && mediaUrls.length > 0) {
      score += Math.min(mediaUrls.length * 15, 30); // 15 points per media asset, max 30
    }

    // ── 3. Relevance & References (Max: 20 Points) ──
    const linkRegex = /https?:\/\/[^\s$.?#].[^\s]*/gi;
    const hasLinks = linkRegex.test(content) || (metadata && (metadata.githubLink || metadata.demoLink || metadata.registrationLink));
    if (hasLinks) {
      score += 10;
    }

    // Tech stack or tags validation
    const hasTechStack = metadata && metadata.techStack && Array.isArray(metadata.techStack) && metadata.techStack.length > 0;
    if (hasTechStack) {
      score += 10;
    } else {
      // Look for code blocks or tags inside content
      const hasCodeBlocks = content.includes('```');
      if (hasCodeBlocks) score += 10;
    }

    // ── 4. Interactive Features (Max: 20 Points) ──
    // Boost structured post types because they require more user effort to write
    if (type === 'project' && metadata && metadata.githubLink && metadata.techStack) {
      score += 20;
    } else if (type === 'poll' && metadata && (metadata.pollOptions || metadata.options)) {
      score += 20;
    } else if (type === 'internship' && metadata && metadata.company && metadata.role) {
      score += 20;
    } else if (type === 'event' && metadata && metadata.eventDate) {
      score += 20;
    } else if (type === 'achievement' && metadata && metadata.title) {
      score += 15;
    } else if (type === 'question' && title.trim().length > 10) {
      score += 15;
    } else {
      score += 10; // Basic discussion or resource
    }

    // Cap the score at 100
    return Math.min(score, 100);
  }

  /**
   * Recalculates quality score incorporating real engagement factors.
   * 
   * @param {number} baseScore - static quality score
   * @param {object} metrics - { views, likes, comments, saves, shares }
   * @returns {number} dynamic score from 0 to 100
   */
  static calculateDynamicScore(baseScore = 50, metrics = {}) {
    const { views = 0, likes = 0, comments = 0, saves = 0, shares = 0 } = metrics;
    if (views < 10) return baseScore;

    const totalEngagement = likes + comments * 1.5 + saves * 2 + shares * 2.5;
    const engagementRatio = totalEngagement / views;

    let adjustment = 0;
    if (engagementRatio > 0.3) {
      adjustment = 20;
    } else if (engagementRatio > 0.15) {
      adjustment = 10;
    } else if (engagementRatio < 0.02) {
      adjustment = -15;
    }

    return Math.max(0, Math.min(baseScore + adjustment, 100));
  }
}

module.exports = QualityScoringEngine;
