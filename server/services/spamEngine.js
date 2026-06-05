/**
 * Spam Detection Engine - Text similarity scorer & spam detection guard
 */

class SpamEngine {
  /**
   * Calculate Jaccard Similarity index between two text blocks
   * @param {string} textA 
   * @param {string} textB 
   * @returns {number} Float between 0.0 and 1.0
   */
  static getSimilarityScore(textA, textB) {
    if (!textA || !textB) return 0;

    const tokenize = (text) => {
      return new Set(
        text
          .toLowerCase()
          .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, '') // remove punctuation
          .split(/\s+/)
          .filter(word => word.length > 2) // only words longer than 2 characters
      );
    };

    const setA = tokenize(textA);
    const setB = tokenize(textB);

    if (setA.size === 0 || setB.size === 0) return 0;

    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);

    return intersection.size / union.size;
  }

  /**
   * Check if an incoming post content is a duplicate/near-duplicate of recent posts
   * @param {string} incomingContent 
   * @param {Array<object>} recentPosts - List of recent posts in the last hour/day
   * @param {number} similarityThreshold - Default 0.8
   * @returns {object} { isSpam: boolean, reason: string|null, similarity: number }
   */
  static evaluate(incomingContent, recentPosts, similarityThreshold = 0.8) {
    if (!incomingContent) {
      return { isSpam: false, reason: null, similarity: 0 };
    }

    for (const post of recentPosts) {
      const similarity = SpamEngine.getSimilarityScore(incomingContent, post.content);
      if (similarity >= similarityThreshold) {
        return {
          isSpam: true,
          reason: 'duplicate_near_duplicate',
          similarity: parseFloat(similarity.toFixed(2)),
          matchingPostId: post._id,
        };
      }
    }

    return {
      isSpam: false,
      reason: null,
      similarity: 0,
    };
  }
}

module.exports = SpamEngine;
