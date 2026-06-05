const Profile = require('../models/Profile');
const User = require('../models/User');

class MentorshipEngine {
  /**
   * Suggests potential mentors for a student/mentee
   */
  static async suggestMentors(menteeId) {
    const menteeUser = await User.findById(menteeId).lean();
    if (!menteeUser) return [];

    const menteeProfile = await Profile.findOne({ userId: menteeId }).lean();
    if (!menteeProfile) return [];

    // Query other profiles that could be mentors
    const candidates = await Profile.find({ userId: { $ne: menteeId } })
      .populate('userId', 'firstName lastName email branch semester')
      .lean();

    const suggestions = [];
    const menteeInterests = new Set((menteeProfile.interests || []).map(i => i.toLowerCase()));
    const menteeSkills = new Set((menteeProfile.skills || []).map(s => s.toLowerCase()));

    const menteeSemNum = parseInt(menteeUser.semester) || 1;

    for (const mentor of candidates) {
      if (!mentor.userId) continue;

      let score = 0;
      const matchedTopics = [];
      const mentorSkills = mentor.skills || [];
      const mentorInterests = mentor.interests || [];

      // 1. Complementary Skills (Mentor possesses skills that Mentee is interested in)
      for (const skill of mentorSkills) {
        if (menteeInterests.has(skill.toLowerCase())) {
          score += 25; // 25 points per matching skill
          matchedTopics.push(skill);
        }
      }

      // Mutual learning bonus: Mentor is interested in skills that Mentee possesses
      let mutualLearning = false;
      for (const skill of menteeSkills) {
        if (mentorInterests.includes(skill.toLowerCase())) {
          score += 15;
          mutualLearning = true;
        }
      }

      // 2. Seniority Match (Higher semester is preferred for peer mentoring, or same semester for peer learning)
      const mentorSemNum = parseInt(mentor.userId.semester) || 1;
      const semDifference = mentorSemNum - menteeSemNum;
      if (semDifference > 0) {
        score += Math.min(semDifference * 10, 30); // up to 30 pts for seniority
      } else if (semDifference === 0) {
        score += 15; // 15 pts for peer-learning partner (same semester)
      }

      // 3. Experience level differential
      const mentorLevel = mentor.profileLevel || 'beginner';
      const menteeLevel = menteeProfile.profileLevel || 'beginner';
      
      const levels = ['beginner', 'intermediate', 'advanced', 'campus_pro'];
      const mentorIdx = levels.indexOf(mentorLevel);
      const menteeIdx = levels.indexOf(menteeLevel);

      if (mentorIdx > menteeIdx) {
        score += (mentorIdx - menteeIdx) * 15; // 15 pts per level above mentee
      }

      // 4. Same branch bonus
      if (menteeUser.branch && mentor.userId.branch && 
          menteeUser.branch.toLowerCase() === mentor.userId.branch.toLowerCase()) {
        score += 10;
      }

      // Only recommend if there's a skill alignment or solid seniority match
      if (score >= 20 && matchedTopics.length > 0) {
        suggestions.push({
          mentorId: mentor.userId._id,
          mentorName: `${mentor.userId.firstName} ${mentor.userId.lastName}`,
          email: mentor.userId.email,
          branch: mentor.userId.branch,
          semester: mentor.userId.semester,
          skills: mentorSkills,
          bio: mentor.bio || '',
          compatibilityScore: Math.min(score, 100),
          matchedTopics: [...new Set(matchedTopics)],
          mutualLearning,
        });
      }
    }

    return suggestions.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  }
}

module.exports = MentorshipEngine;
