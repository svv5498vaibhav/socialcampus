const Profile = require('../models/Profile');
const ProjectTeam = require('../models/ProjectTeam');
const User = require('../models/User');

class TeamMatchingEngine {
  /**
   * Finds matching teams for a user
   */
  static async suggestTeamsForUser(userId) {
    const user = await User.findById(userId).lean();
    if (!user) return [];

    const profile = await Profile.findOne({ userId }).lean();
    if (!profile) return [];

    const teams = await ProjectTeam.find({ status: 'recruiting' }).lean();
    const matches = [];

    const userSkills = new Set((profile.skills || []).map(s => s.toLowerCase()));
    const userInterests = new Set((profile.interests || []).map(i => i.toLowerCase()));

    for (const team of teams) {
      // Creator is already on the team
      if (team.creatorId.toString() === userId.toString()) continue;

      // Check if user is already a member or pending
      const alreadyMember = team.members.some(m => m.userId.toString() === userId.toString());
      if (alreadyMember) continue;

      let score = 0;
      const matchedSkills = [];
      const matchedInterests = [];
      let commonAvailability = false;

      // 1. Skill overlap (up to 50 pts)
      const teamSkills = team.skillsRequired || [];
      if (teamSkills.length > 0) {
        let skillMatches = 0;
        for (const skill of teamSkills) {
          if (userSkills.has(skill.toLowerCase())) {
            skillMatches++;
            matchedSkills.push(skill);
          }
        }
        score += Math.round((skillMatches / teamSkills.length) * 50);
      }

      // 2. Interest overlap (up to 20 pts)
      const teamInterests = team.interests || [];
      if (teamInterests.length > 0) {
        let interestMatches = 0;
        for (const interest of teamInterests) {
          if (userInterests.has(interest.toLowerCase())) {
            interestMatches++;
            matchedInterests.push(interest);
          }
        }
        score += Math.round((interestMatches / teamInterests.length) * 20);
      }

      // 3. Experience level alignment (up to 20 pts)
      // Profile level: 'beginner', 'intermediate', 'advanced', 'campus_pro'
      // Team level: 'beginner', 'intermediate', 'advanced', 'any'
      if (team.experienceLevel === 'any') {
        score += 20;
      } else {
        const profileLevel = profile.profileLevel || 'beginner';
        if (team.experienceLevel === profileLevel) {
          score += 20;
        } else if (
          (team.experienceLevel === 'intermediate' && profileLevel === 'advanced') ||
          (team.experienceLevel === 'advanced' && profileLevel === 'campus_pro')
        ) {
          score += 15; // User is overqualified, still good
        } else {
          score += 5;
        }
      }

      // 4. Availability overlap (up to 10 pts)
      if (team.availability === 'flexible' || profile.availability === 'flexible') {
        score += 10;
        commonAvailability = true;
      }

      if (score > 15) {
        matches.push({
          userId,
          targetTeamId: team._id,
          matchType: 'team_match',
          compatibilityScore: Math.min(score, 100),
          matchedSkills,
          matchedInterests,
          commonGoals: team.projectGoals ? [team.projectGoals] : [],
          commonAvailability,
          status: 'active',
        });
      }
    }

    return matches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  }

  /**
   * Finds matching peers for a user/team matching
   */
  static async suggestPeersForUser(userId) {
    const user = await User.findById(userId).lean();
    if (!user) return [];

    const profile = await Profile.findOne({ userId }).lean();
    if (!profile) return [];

    // Query other profiles
    const otherProfiles = await Profile.find({ userId: { $ne: userId } })
      .populate('userId', 'firstName lastName email branch semester')
      .lean();

    const matches = [];
    const userSkills = new Set((profile.skills || []).map(s => s.toLowerCase()));
    const userInterests = new Set((profile.interests || []).map(i => i.toLowerCase()));

    for (const other of otherProfiles) {
      if (!other.userId) continue;

      let score = 0;
      const matchedSkills = [];
      const matchedInterests = [];

      const otherSkills = other.skills || [];
      const otherInterests = other.interests || [];

      // Skills overlap
      for (const skill of otherSkills) {
        if (userSkills.has(skill.toLowerCase())) {
          matchedSkills.push(skill);
        }
      }

      // Interests overlap
      for (const interest of otherInterests) {
        if (userInterests.has(interest.toLowerCase())) {
          matchedInterests.push(interest);
        }
      }

      // Calculate Jaccard similarity for skills
      const unionSkillsSize = new Set([...userSkills, ...otherSkills.map(s => s.toLowerCase())]).size;
      if (unionSkillsSize > 0) {
        score += Math.round((matchedSkills.length / unionSkillsSize) * 60);
      }

      // Calculate Jaccard similarity for interests
      const unionInterestsSize = new Set([...userInterests, ...otherInterests.map(i => i.toLowerCase())]).size;
      if (unionInterestsSize > 0) {
        score += Math.round((matchedInterests.length / unionInterestsSize) * 30);
      }

      // Branch match
      if (user.branch && other.userId.branch && user.branch.toLowerCase() === other.userId.branch.toLowerCase()) {
        score += 10;
      }

      if (score > 15) {
        matches.push({
          userId,
          targetUserId: other.userId._id,
          matchType: 'peer_match',
          compatibilityScore: Math.min(score, 100),
          matchedSkills,
          matchedInterests,
          commonGoals: other.careerGoals || [],
          commonAvailability: true,
          status: 'active',
        });
      }
    }

    return matches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  }
}

module.exports = TeamMatchingEngine;
