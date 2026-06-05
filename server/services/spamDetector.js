const Post = require('../models/Post');

class SpamDetector {
  /**
   * Checks post text for clickbait, spam keywords, and duplicate content.
   * 
   * @param {string} title 
   * @param {string} content 
   * @param {string} authorId 
   * @returns {Promise<{ isSpam: boolean, spamScore: number, reasons: Array<string> }>}
   */
  static async detectSpam(title = '', content = '', authorId) {
    const reasons = [];
    let spamScore = 0;

    const combinedText = `${title} ${content}`.toLowerCase();

    // ── 1. Spam Keyword Checklist ──
    const spamKeywords = [
      'free cash', 'make money', 'click here', 'guaranteed success', 
      'double your', 'unlimited free', 'earn money', 'get rich', 
      'investment plan', 'crypto wealth', 'claim reward', 'winner alert',
      'work from home online', 'binary option', 'testosterone booster'
    ];

    let keywordCount = 0;
    spamKeywords.forEach(keyword => {
      if (combinedText.includes(keyword)) {
        keywordCount++;
        spamScore += 25; // 25 points per spam keyword match
        reasons.push(`Contains spam keyword: "${keyword}"`);
      }
    });

    // ── 2. Clickbait & Excessive Punctuation Check ──
    const clickbaitKeywords = [
      'you wont believe', 'must see', 'shocking truth', 'secret formula',
      'revealed', 'will change your life', 'omg', 'what happened next'
    ];

    clickbaitKeywords.forEach(keyword => {
      if (combinedText.includes(keyword)) {
        spamScore += 15;
        reasons.push(`Contains clickbait pattern: "${keyword}"`);
      }
    });

    // Excessive capitalization check
    const upperCount = (content.match(/[A-Z]/g) || []).length;
    const totalChar = content.length;
    if (totalChar > 20 && (upperCount / totalChar) > 0.6) {
      spamScore += 20;
      reasons.push('Excessive capitalization (potential shouting/clickbait)');
    }

    // Excessive exclamation/question marks
    const punctuationCount = (content.match(/[!?]{3,}/g) || []).length;
    if (punctuationCount > 0) {
      spamScore += 15;
      reasons.push('Excessive exclamation or question marks');
    }

    // ── 3. Duplicate Content Check ──
    if (authorId) {
      // Find user's posts in the last 1 hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentPosts = await Post.find({
        authorId,
        createdAt: { $gte: oneHourAgo }
      }).limit(5).lean();

      for (const p of recentPosts) {
        // Simple Jaccard similarity or direct match check
        const directMatch = p.content.trim() === content.trim() || p.title?.trim() === title?.trim();
        if (directMatch) {
          spamScore = 100; // Immediate block / mark as spam
          reasons.push('Exact duplicate of a recent post by the same author');
          break;
        }

        // Check if content overlaps heavily (similarity index)
        const sim = this.calculateTextSimilarity(p.content, content);
        if (sim > 0.8) {
          spamScore = Math.max(spamScore, 85);
          reasons.push(`Highly similar content (similarity score: ${Math.round(sim * 100)}%) to a recent post`);
          break;
        }
      }
    }

    // Cap the score
    spamScore = Math.min(spamScore, 100);

    return {
      isSpam: spamScore >= 60, // Consider spam if score is 60 or above
      spamScore,
      reasons
    };
  }

  /**
   * Helper to calculate simple Jaccard-like similarity between two texts.
   */
  static calculateTextSimilarity(text1, text2) {
    const getWords = (t) => new Set(t.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean));
    const words1 = getWords(text1);
    const words2 = getWords(text2);

    if (words1.size === 0 || words2.size === 0) return 0;

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Evaluates if user behavior or post action frequency indicates bot/fake activity.
   * 
   * @param {string} actionType - 'like' | 'comment' | 'post'
   * @param {string} userId 
   * @param {string} redisClient - optional redis cache instance (if we want to use Redis rate tracking)
   */
  static async checkSuspiciousRate(actionType, userId, cache) {
    if (!cache) return false; // Graceful skip if cache unavailable

    const key = `rate:${actionType}:${userId}`;
    const windowSeconds = 60; // 1 minute window

    try {
      const current = await cache.incr(key);
      if (current === 1) {
        await cache.expire(key, windowSeconds);
      }

      // Max actions per minute thresholds:
      // Likes: 40/min, Comments: 15/min, Posts: 5/min
      const thresholds = {
        like: 40,
        comment: 15,
        post: 5
      };

      const limit = thresholds[actionType] || 20;
      return current > limit;
    } catch {
      return false; // Fail safe
    }
  }
}

module.exports = SpamDetector;
