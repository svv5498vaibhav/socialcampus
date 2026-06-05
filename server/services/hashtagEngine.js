class HashtagEngine {
  /**
   * Generates matching hashtags based on title, content and type.
   * 
   * @param {string} title 
   * @param {string} content 
   * @param {string} type 
   * @returns {Array<string>} list of hashtags (without '#' symbol, lowercase)
   */
  static generate(title = '', content = '', type = 'discussion') {
    const hashtags = new Set();

    // 1. Add post type as a base tag
    if (type) {
      const typeTags = {
        project: ['project', 'campusproject', 'build'],
        achievement: ['achievement', 'careerwin', 'success'],
        resource: ['learning', 'resources', 'education'],
        event: ['campusevent', 'networking', 'workshop'],
        internship: ['internship', 'hiring', 'careerops'],
        question: ['help', 'askcampusx', 'doubts'],
        poll: ['poll', 'opinions'],
        announcement: ['announcement', 'official'],
        discussion: ['discussion', 'community']
      };
      (typeTags[type] || []).forEach(tag => hashtags.add(tag));
    }

    // 2. Keyword mapping dictionary (Key: match keyword in lowercase, Value: output tag)
    const keywordMap = {
      // Tech Stack / Languages
      'javascript': 'javascript',
      'typescript': 'typescript',
      'python': 'python',
      'java': 'java',
      'c++': 'cpp',
      'rust': 'rust',
      'golang': 'golang',
      'html': 'html',
      'css': 'css',
      'react': 'react',
      'vue': 'vue',
      'angular': 'angular',
      'next.js': 'nextjs',
      'nextjs': 'nextjs',
      'node': 'nodejs',
      'express': 'expressjs',
      'mongodb': 'mongodb',
      'mongoose': 'mongodb',
      'redis': 'redis',
      'sql': 'sql',
      'postgresql': 'postgres',
      'docker': 'docker',
      'kubernetes': 'k8s',
      'aws': 'aws',
      'gcp': 'gcp',
      'firebase': 'firebase',
      
      // ML & AI
      'opencv': 'opencv',
      'tensorflow': 'tensorflow',
      'pytorch': 'pytorch',
      'deep learning': 'deeplearning',
      'machine learning': 'machinelearning',
      'artificial intelligence': 'ai',
      'nlp': 'nlp',
      'computer vision': 'computervision',
      'data science': 'datascience',
      
      // General Career / Academic
      'placement': 'placements',
      'resume': 'resume',
      'interview': 'interviews',
      'dsa': 'dsa',
      'leetcode': 'leetcode',
      'semester': 'academics',
      'exam': 'exams',
      'hackathon': 'hackathon',
      'coding': 'coding',
      'startup': 'startup',
      'entrepreneurship': 'entrepreneurship'
    };

    const combinedText = `${title} ${content}`.toLowerCase();

    // 2. Extract any pre-written hashtags in the text (e.g. #WebDev, #Flutter)
    const hashtagRegex = /#([a-zA-Z0-9_]{2,})/g;
    let match;
    while ((match = hashtagRegex.exec(combinedText)) !== null) {
      hashtags.add(match[1].toLowerCase());
    }

    // 3. Keyword mapping dictionary (Key: match keyword in lowercase, Value: output tag)
    // Check for keyword matches
    Object.keys(keywordMap).forEach(key => {
      // Ensure we match whole words or specific boundary patterns
      const regex = new RegExp(`\\b${key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
      if (regex.test(combinedText)) {
        hashtags.add(keywordMap[key]);
      }
    });

    // Limit to maximum 8 hashtags to keep it clean and relevant
    return Array.from(hashtags).slice(0, 8);
  }
}

module.exports = HashtagEngine;
