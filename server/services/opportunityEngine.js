const Post = require('../models/Post');
const Profile = require('../models/Profile');
const User = require('../models/User');

class OpportunityEngine {
  /**
   * Recommends hackathons, internships, events, and workshops based on student profile.
   * 
   * @param {string} userId 
   * @returns {Promise<Array<object>>} Recommended opportunities
   */
  static async recommendOpportunities(userId) {
    if (!userId) return [];

    try {
      // 1. Fetch user and profile
      const [user, profile] = await Promise.all([
        User.findById(userId).lean(),
        Profile.findOne({ userId }).lean()
      ]);

      if (!user || !profile) return [];

      const userSkills = (profile.skills || []).map(s => s.toLowerCase());
      const userInterests = (profile.interests || []).map(i => i.toLowerCase());
      const userBranch = user.branch || '';

      // 2. Fetch recent internship/event posts
      const opportunities = await Post.find({
        type: { $in: ['internship', 'event'] },
        isSpam: false,
        isReported: false
      }).populate('authorId', 'firstName lastName college branch').limit(50).lean();

      const scoredOps = [];

      for (const op of opportunities) {
        let score = 10; // base score
        const reasons = [];

        // Check date validity if event
        if (op.type === 'event' && op.metadata && op.metadata.eventDate) {
          const eventDate = new Date(op.metadata.eventDate);
          if (eventDate < new Date()) continue; // skip past events
        }

        // Check date validity if internship
        if (op.type === 'internship' && op.metadata && op.metadata.applicationDeadline) {
          const deadline = new Date(op.metadata.applicationDeadline);
          if (deadline < new Date()) continue; // skip expired internships
        }

        // Branch relevance (+20)
        if (op.authorId && op.authorId.branch === userBranch) {
          score += 20;
          reasons.push('Branch aligned');
        }

        const tags = (op.hashtags || []).map(t => t.toLowerCase());
        const text = `${op.title} ${op.content}`.toLowerCase();

        // Skill overlap
        let skillMatches = 0;
        userSkills.forEach(skill => {
          if (tags.includes(skill) || text.includes(skill)) {
            skillMatches++;
          }
        });
        if (skillMatches > 0) {
          score += Math.min(skillMatches * 15, 45);
          reasons.push('Matches your skills');
        }

        // Interest overlap
        let interestMatches = 0;
        userInterests.forEach(interest => {
          if (tags.includes(interest) || text.includes(interest)) {
            interestMatches++;
          }
        });
        if (interestMatches > 0) {
          score += Math.min(interestMatches * 10, 30);
          reasons.push('Matches your interests');
        }

        // Quality boost
        score += (op.qualityScore || 0) * 0.2;

        scoredOps.push({
          ...op,
          opportunityScore: Math.round(score),
          matchReason: reasons.join(' • ') || 'General recommendation'
        });
      }

      // Sort by score descending
      return scoredOps.sort((a, b) => b.opportunityScore - a.opportunityScore).slice(0, 10);

    } catch (error) {
      console.error('Error in opportunity recommendations:', error);
      return [];
    }
  }
}

module.exports = OpportunityEngine;
