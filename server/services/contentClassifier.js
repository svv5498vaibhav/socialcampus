class ContentClassifier {
  /**
   * Classify post type based on content, title, metadata and user role.
   * 
   * @param {string} title 
   * @param {string} content 
   * @param {object} metadata 
   * @param {string} userRole 
   * @returns {string} classified post type
   */
  static classify(title = '', content = '', metadata = {}, userRole = 'student') {
    const combinedText = `${title} ${content}`.toLowerCase();

    // 1. Poll check: If poll options are explicitly provided in metadata
    if (metadata && (metadata.pollOptions || (metadata.options && Array.isArray(metadata.options) && metadata.options.length > 0))) {
      return 'poll';
    }

    // 2. Announcement check: Only admins/moderators can make announcements and they contain specific keywords
    if ((userRole === 'admin' || userRole === 'moderator') && 
        (combinedText.includes('announcement') || combinedText.includes('official') || combinedText.includes('notice:') || combinedText.includes('important announcement'))) {
      return 'announcement';
    }

    // 3. Internship check
    const internshipKeywords = ['internship', 'hiring', 'stipend', 'job description', 'intern role', 'apply now', 'apply link', 'jd:', 'remuneration'];
    const hasInternshipMetadata = metadata && (metadata.company || metadata.stipend || metadata.role);
    if (hasInternshipMetadata || internshipKeywords.some(keyword => combinedText.includes(keyword))) {
      return 'internship';
    }

    // 4. Event check
    const eventKeywords = ['event', 'workshop', 'hackathon', 'webinar', 'seminar', 'rsvp', 'register here', 'venue', 'guest speaker', 'symposium'];
    const hasEventMetadata = metadata && (metadata.eventDate || metadata.venue || metadata.registrationLink);
    if (hasEventMetadata || eventKeywords.some(keyword => combinedText.includes(keyword))) {
      return 'event';
    }

    // 5. Project check
    const projectKeywords = ['github.com', 'demo link', 'repo link', 'tech stack', 'built a', 'created a', 'developed an app', 'designed a website', 'npm i', 'yarn add', 'source code'];
    const hasProjectMetadata = metadata && (metadata.githubLink || metadata.demoLink || metadata.techStack);
    if (hasProjectMetadata || projectKeywords.some(keyword => combinedText.includes(keyword))) {
      return 'project';
    }

    // 6. Achievement check
    const achievementKeywords = ['proud to share', 'secured rank', 'secured first', 'placed at', 'won the', 'cleared exam', 'certified', 'badge', 'gold medalist', 'first place', 'hackathon winner'];
    if (achievementKeywords.some(keyword => combinedText.includes(keyword))) {
      return 'achievement';
    }

    // 7. Resource check
    const resourceKeywords = ['cheat sheet', 'tutorial', 'documentation', 'drive.google.com', 'medium.com', 'dev.to', 'youtube.com/watch', 'udemy', 'coursera', 'reference material', 'pdf link', 'slides', 'resource link'];
    if (resourceKeywords.some(keyword => combinedText.includes(keyword))) {
      return 'resource';
    }

    // 8. Question check
    const isQuestion = combinedText.includes('?') || 
                       combinedText.startsWith('how ') || 
                       combinedText.startsWith('why ') || 
                       combinedText.startsWith('what ') || 
                       combinedText.startsWith('can anyone ') || 
                       combinedText.startsWith('does anyone ');
    if (isQuestion) {
      return 'question';
    }

    // 9. Default
    return 'discussion';
  }
}

module.exports = ContentClassifier;
