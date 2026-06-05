class QualityEngine {
  /**
   * Evaluates the quality of a ContentPost (articles, blogs, achievements, etc.)
   */
  static evaluateContent(title = '', content = '', mediaCount = 0, tagsCount = 0) {
    let completeness = 0;
    let readability = 50; // Base score
    let structure = 0;
    let engagement = 0;

    // 1. Completeness (up to 30 pts)
    if (title.trim().length >= 10) completeness += 10;
    if (content.trim().length >= 500) completeness += 20;
    else if (content.trim().length >= 100) completeness += 10;

    // 2. Readability Approximation (up to 30 pts)
    const words = content.trim().split(/\s+/).filter(w => w.length > 0);
    const sentences = content.trim().split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (words.length > 0 && sentences.length > 0) {
      const avgSentenceLength = words.length / sentences.length;
      // Ideal sentence length for readability is between 12 and 18 words
      if (avgSentenceLength >= 12 && avgSentenceLength <= 18) {
        readability = 90;
      } else if (avgSentenceLength > 18 && avgSentenceLength <= 25) {
        readability = 75;
      } else if (avgSentenceLength > 25) {
        readability = 55; // Too long, wordy
      } else {
        readability = 70; // Short/simple
      }
    }

    // 3. Structure (up to 20 pts)
    // Check for markdown headers (#), bullet points (- or *), bold tags (**)
    if (/#+\s\w+/.test(content)) structure += 8;
    if (/[\-*]\s\w+/.test(content)) structure += 7;
    if (/\*\*\w+\*\*/.test(content)) structure += 5;

    // 4. Engagement Potential (up to 20 pts)
    if (mediaCount > 0) engagement += 10;
    if (tagsCount > 0) engagement += 10;

    const completenessWt = (completeness / 30) * 35; // max 35
    const readabilityWt = (readability / 100) * 25; // max 25
    const structureWt = (structure / 20) * 20; // max 20
    const engagementWt = (engagement / 20) * 20; // max 20

    const qualityScore = Math.round(completenessWt + readabilityWt + structureWt + engagementWt);

    return {
      qualityScore: Math.max(10, Math.min(qualityScore, 100)),
      completenessScore: Math.round((completeness / 30) * 100),
      readabilityScore: readability,
      structureScore: Math.round((structure / 20) * 100),
      engagementScore: Math.round((engagement / 20) * 100)
    };
  }

  /**
   * Evaluates the quality of a Project Showcase
   */
  static evaluateProject(projectData) {
    const {
      title = '',
      description = '',
      githubLink = '',
      demoLink = '',
      videoUrl = '',
      screenshotUrls = [],
      documentation = '',
      techStack = []
    } = projectData;

    let score = 0;

    // 1. Title completeness (10 pts)
    if (title.trim().length >= 10) score += 10;

    // 2. Description completeness (20 pts)
    if (description.trim().length >= 200) score += 20;
    else if (description.trim().length >= 50) score += 10;

    // 3. Code repository integration (20 pts)
    const hasGithub = githubLink && githubLink.includes('github.com');
    if (hasGithub) score += 20;

    // 4. Deployment/Demo URL verification (15 pts)
    const hasDemo = demoLink && (demoLink.startsWith('http://') || demoLink.startsWith('https://'));
    if (hasDemo) score += 15;

    // 5. Media & Proof of work (15 pts)
    const hasScreenshots = Array.isArray(screenshotUrls) && screenshotUrls.length > 0;
    const hasVideo = !!videoUrl;
    if (hasScreenshots) score += 10;
    if (hasVideo) score += 5;

    // 6. Detailed documentation & Readme (10 pts)
    if (documentation.trim().length >= 500) score += 10;
    else if (documentation.trim().length >= 100) score += 5;

    // 7. Tech Stack identification (10 pts)
    if (Array.isArray(techStack) && techStack.length >= 3) score += 10;
    else if (Array.isArray(techStack) && techStack.length > 0) score += 5;

    return {
      qualityScore: score,
      completenessScore: Math.round((score / 100) * 100),
      readabilityScore: description.trim().length > 100 ? 80 : 50,
      hasGithub,
      hasDemo
    };
  }
}

module.exports = QualityEngine;
