class PostSummarizer {
  /**
   * Generates a concise summary (max 100-150 chars) of a post.
   * 
   * @param {string} title 
   * @param {string} content 
   * @param {string} type 
   * @returns {string} summary
   */
  static summarize(title = '', content = '', type = 'discussion') {
    const cleanContent = content.trim().replace(/\s+/g, ' ');
    if (cleanContent.length <= 100) {
      return cleanContent;
    }

    // Split text into sentences
    const sentences = cleanContent
      .split(/(?<=[.!?])\s+/)
      .filter(s => s.trim().length > 5);

    if (sentences.length === 0) {
      return cleanContent.substring(0, 100) + '...';
    }

    // Heuristics: if it's a project, try to summarize it cleanly
    if (type === 'project' && title) {
      const summaryText = `A project showcase: "${title}". ${sentences[0]}`;
      return summaryText.length > 120 ? summaryText.substring(0, 117) + '...' : summaryText;
    }

    // Heuristics: if it's an internship
    if (type === 'internship' && title) {
      const summaryText = `Internship opportunity: "${title}". ${sentences[0]}`;
      return summaryText.length > 120 ? summaryText.substring(0, 117) + '...' : summaryText;
    }

    // Score sentences based on length (prefer 40-100 characters), position (prefer early), and keywords
    const keywords = [
      'developed', 'built', 'created', 'announced', 'achievement', 'won', 'hiring', 
      'internship', 'tutorial', 'react', 'node', 'python', 'java', 'github', 'register'
    ];

    let bestSentence = sentences[0];
    let bestScore = -1;

    sentences.forEach((sentence, idx) => {
      let score = 0;
      // Prefer earlier sentences
      score += Math.max(10 - idx * 2, 0); 

      // Length optimization (optimal size around 60-90 characters)
      const len = sentence.length;
      if (len >= 50 && len <= 100) score += 8;
      else if (len >= 30 && len <= 150) score += 4;

      // Keyword matches
      const lowerSentence = sentence.toLowerCase();
      keywords.forEach(keyword => {
        if (lowerSentence.includes(keyword)) score += 5;
      });

      if (score > bestScore) {
        bestScore = score;
        bestSentence = sentence;
      }
    });

    // Clean summary
    let finalSummary = bestSentence.trim();
    if (finalSummary.length > 120) {
      finalSummary = finalSummary.substring(0, 117) + '...';
    }
    
    // Add title context if useful
    if (title && !finalSummary.toLowerCase().includes(title.toLowerCase().substring(0, 10))) {
      const context = `[${title}] ${finalSummary}`;
      return context.length > 120 ? context.substring(0, 117) + '...' : context;
    }

    return finalSummary;
  }
}

module.exports = PostSummarizer;
