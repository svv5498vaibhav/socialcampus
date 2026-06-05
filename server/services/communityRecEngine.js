const Community = require('../models/Community');
const CommunityMember = require('../models/CommunityMember');
const Profile = require('../models/Profile');

class CommunityRecEngine {
  /**
   * Generates community recommendations for a user.
   */
  static async generateRecommendations(userId, userDetails) {
    const profile = await Profile.findOne({ userId }).lean();
    const joinedCommunities = await CommunityMember.find({ userId }).select('communityId').lean();
    const joinedIds = new Set(joinedCommunities.map(c => c.communityId.toString()));

    const allCommunities = await Community.find({}).lean();
    const recommendations = [];

    const userSkills = profile?.skills || [];
    const userInterests = profile?.interests || [];
    const userBranch = userDetails.branch || '';
    const userSemester = userDetails.semester || '';

    for (const community of allCommunities) {
      if (joinedIds.has(community._id.toString())) continue;

      let score = 0;
      const signals = [];

      // Branch match
      if (community.type === 'branch' && userBranch) {
        if (community.name.toLowerCase().includes(userBranch.toLowerCase()) || 
            community.topic.toLowerCase() === userBranch.toLowerCase()) {
          score += 45;
          signals.push(`Matches your branch: ${userBranch}`);
        }
      }

      // Semester match
      if (community.type === 'semester' && userSemester) {
        if (community.name.toLowerCase().includes(userSemester.toLowerCase()) || 
            community.topic.toLowerCase() === userSemester.toLowerCase()) {
          score += 35;
          signals.push(`Matches your semester: ${userSemester}`);
        }
      }

      // Technology & Skills match
      if (community.type === 'technology') {
        const topic = community.topic.toLowerCase();
        
        const matchesSkill = userSkills.some(skill => 
          skill.toLowerCase().includes(topic) || topic.includes(skill.toLowerCase())
        );
        const matchesInterest = userInterests.some(interest => 
          interest.toLowerCase().includes(topic) || topic.includes(interest.toLowerCase())
        );

        if (matchesSkill) {
          score += 25;
          signals.push(`Aligns with your skill: ${community.topic}`);
        }
        if (matchesInterest) {
          score += 15;
          signals.push(`Aligns with your interest: ${community.topic}`);
        }
      }

      // Project match
      if (community.type === 'project') {
        const topic = community.topic.toLowerCase();
        const matchesInterest = userInterests.some(interest => 
          interest.toLowerCase().includes(topic) || topic.includes(interest.toLowerCase())
        );
        if (matchesInterest) {
          score += 20;
          signals.push(`Relevant to your project interest: ${community.topic}`);
        }
      }

      if (score > 0) {
        // Cap score at 100
        const finalScore = Math.min(score, 100);
        recommendations.push({
          userId,
          communityId: community._id,
          recommendationScore: finalScore,
          signals,
          status: 'active',
        });
      }
    }

    // Sort by score descending
    recommendations.sort((a, b) => b.recommendationScore - a.recommendationScore);
    return recommendations;
  }
}

module.exports = CommunityRecEngine;
