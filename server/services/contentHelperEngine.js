class ContentHelperEngine {
  /**
   * Generates caption templates based on title and content outline
   */
  static generateCaptions(title, type, summary = '') {
    const brief = summary || `Check out my new ${type} post!`;
    return [
      `🚀 Excited to share my latest ${type} on CampusX: "${title}"! \n\n${brief}\n\nRead more on CampusX! #CampusX #StudentInnovation`,
      `📢 New Update! Just published "${title}" under the ${type} catalog. \n\n🔑 Key Highlights:\n- ${brief}\n\nLet me know your thoughts in the comments below! 👇`,
      `💡 Deep Dive: "${title}" - A student collaboration project.\n\n${brief}\n\n#Collaborate #CampusConnect`
    ];
  }

  /**
   * Generates a 2-3 sentence summary of the post body
   */
  static generateSummary(content) {
    if (!content) return 'No content provided.';
    const sentences = content
      .replace(/([.?!])\s*(?=[A-Z])/g, '$1|')
      .split('|')
      .map(s => s.trim())
      .filter(s => s.length > 5);

    if (sentences.length <= 2) {
      return content.substring(0, 150) + (content.length > 150 ? '...' : '');
    }
    return sentences.slice(0, 2).join(' ') + (sentences.length > 2 ? '..' : '');
  }

  /**
   * Heuristic grammar correction and style suggestions
   */
  static correctGrammar(content) {
    if (!content) return [];
    
    const rules = [
      { pattern: /\bi\b/g, replacement: 'I', reason: 'Capitalize "I" as a subject pronoun.' },
      { pattern: /\bite\b/gi, replacement: 'it', reason: 'Correct spelling.' },
      { pattern: /\bcant\b/gi, replacement: "can't", reason: 'Missing apostrophe in contraction.' },
      { pattern: /\bdont\b/gi, replacement: "don't", reason: 'Missing apostrophe in contraction.' },
      { pattern: /\bshould of\b/gi, replacement: 'should have', reason: 'Incorrect modal verb preposition conjugation.' },
      { pattern: /\bwould of\b/gi, replacement: 'would have', reason: 'Incorrect modal verb preposition conjugation.' },
      { pattern: /\bcould of\b/gi, replacement: 'could have', reason: 'Incorrect modal verb preposition conjugation.' },
      { pattern: /\bteh\b/gi, replacement: 'the', reason: 'Common typo correction.' },
      { pattern: /\brecieve\b/gi, replacement: 'receive', reason: 'Spelling typo correction.' },
      { pattern: /\bseperate\b/gi, replacement: 'separate', reason: 'Spelling typo correction.' }
    ];

    const corrections = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const rule of rules) {
        if (rule.pattern.test(line)) {
          corrections.push({
            original: line.trim(),
            suggested: line.replace(rule.pattern, rule.replacement).trim(),
            reason: rule.reason,
            line: i + 1
          });
        }
      }
    }

    return corrections.slice(0, 5); // return top 5
  }

  /**
   * Generates tech and career tags based on post content
   */
  static generateTags(title, content) {
    const combined = `${title} ${content}`.toLowerCase();
    const tagMappings = {
      javascript: ['javascript', 'js', 'node', 'react', 'vue', 'angular', 'express'],
      python: ['python', 'py', 'django', 'flask', 'fastapi', 'numpy', 'pandas'],
      java: ['java', 'spring', 'springboot', 'maven'],
      cpp: ['c++', 'cpp', 'clang'],
      webdev: ['css', 'html', 'frontend', 'backend', 'web dev', 'website', 'fullstack'],
      aiml: ['ai', 'ml', 'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'nlp', 'vision'],
      database: ['sql', 'mongodb', 'postgres', 'mysql', 'database', 'redis', 'mongoose'],
      security: ['cybersecurity', 'security', 'hack', 'infosec', 'penetration'],
      career: ['internship', 'interview', 'job', 'resume', 'hire', 'placement'],
      hackathon: ['hackathon', 'event', 'team', 'compete', 'prize'],
      project: ['showcase', 'built', 'deployed', 'github', 'repo']
    };

    const tags = new Set();
    for (const [tag, keywords] of Object.entries(tagMappings)) {
      for (const keyword of keywords) {
        if (combined.includes(keyword)) {
          tags.add(tag);
          break;
        }
      }
    }

    return [...tags];
  }

  /**
   * Detects the category of content
   */
  static detectCategory(title, content) {
    const combined = `${title} ${content}`.toLowerCase();
    const categories = [
      { name: 'AI/ML', keywords: ['ai', 'ml', 'machine learning', 'deep learning', 'nlp', 'vision', 'data science', 'llm', 'chatgpt'] },
      { name: 'Web Development', keywords: ['web', 'react', 'node', 'frontend', 'backend', 'fullstack', 'css', 'html', 'express', 'javascript'] },
      { name: 'Cyber Security', keywords: ['security', 'cyber', 'hack', 'ethical', 'phishing', 'vulnerability', 'encryption'] },
      { name: 'Mobile Development', keywords: ['flutter', 'react native', 'android', 'ios', 'kotlin', 'swift', 'mobile app'] },
      { name: 'Career & Placement', keywords: ['interview', 'placement', 'resume', 'hiring', 'salary', 'internship', 'tcs', 'infosys'] },
      { name: 'Startups & Business', keywords: ['startup', 'founder', 'business', 'funding', 'pitch', 'product'] }
    ];

    let bestCategory = 'General';
    let maxMatches = 0;

    for (const cat of categories) {
      let matches = 0;
      for (const kw of cat.keywords) {
        const matchesCount = (combined.match(new RegExp(`\\b${kw}\\b`, 'g')) || []).length;
        matches += matchesCount;
      }
      if (matches > maxMatches) {
        maxMatches = matches;
        bestCategory = cat.name;
      }
    }

    return bestCategory;
  }
}

module.exports = ContentHelperEngine;
