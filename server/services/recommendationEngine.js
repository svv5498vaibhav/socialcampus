const Profile = require('../models/Profile');
const User = require('../models/User');
const Post = require('../models/Post');
const Recommendation = require('../models/Recommendation');

class RecommendationEngine {
  /**
   * Generates and returns recommendations for a user. Caches them in MongoDB.
   * 
   * @param {string} userId 
   * @returns {Promise<object>} recommendations object
   */
  static async recommendForUser(userId) {
    if (!userId) return {};

    try {
      // 1. Fetch current user and profile
      const [user, profile] = await Promise.all([
        User.findById(userId).lean(),
        Profile.findOne({ userId }).lean()
      ]);

      if (!user || !profile) {
        return {};
      }

      const userBranch = user.branch || '';
      const userCollege = user.college || '';
      const userSkills = (profile.skills || []).map(s => s.toLowerCase());
      const userInterests = (profile.interests || []).map(i => i.toLowerCase());
      const userCareerGoals = (profile.careerGoals || []).map(g => g.toLowerCase());
      const followingList = (profile.following || []).map(id => id.toString());

      // 2. Recommend Students (Same College, Similar Skills/Interests, same Branch/Goal, not already followed)
      const otherProfiles = await Profile.find({
        userId: { $ne: userId },
        onboardingCompleted: true
      }).populate('userId', 'firstName lastName email branch college semester').limit(50).lean();

      const recommendedStudents = [];
      for (const otherProf of otherProfiles) {
        const otherUser = otherProf.userId;
        if (!otherUser) continue;

        // Skip if already following
        if (followingList.includes(otherProf.userId._id.toString())) continue;

        // Skip if different college (if desired for campus network security)
        if (otherUser.college !== userCollege) continue;

        let score = 0;
        let reasons = [];

        // Same branch boost
        if (otherUser.branch === userBranch) {
          score += 25;
          reasons.push('Same Branch');
        }

        // Skills overlap
        const otherSkills = (otherProf.skills || []).map(s => s.toLowerCase());
        const sharedSkills = userSkills.filter(s => otherSkills.includes(s));
        if (sharedSkills.length > 0) {
          score += Math.min(sharedSkills.length * 10, 30);
          reasons.push(`Shared skills: ${sharedSkills.slice(0, 2).join(', ')}`);
        }

        // Interests overlap
        const otherInterests = (otherProf.interests || []).map(i => i.toLowerCase());
        const sharedInterests = userInterests.filter(i => otherInterests.includes(i));
        if (sharedInterests.length > 0) {
          score += Math.min(sharedInterests.length * 10, 30);
          reasons.push(`Similar interests`);
        }

        // Career Goals overlap
        const otherGoals = (otherProf.careerGoals || []).map(g => g.toLowerCase());
        const sharedGoals = userCareerGoals.filter(g => otherGoals.includes(g));
        if (sharedGoals.length > 0) {
          score += 20;
          reasons.push(`Same career goal: "${otherProf.careerGoals[0]}"`);
        }

        if (score > 10) {
          recommendedStudents.push({
            studentId: otherProf.userId._id,
            score,
            reason: reasons.join(' • '),
            details: {
              fullName: `${otherUser.firstName} ${otherUser.lastName}`,
              branch: otherUser.branch,
              semester: otherUser.semester,
              avatarUrl: otherProf.avatarUrl,
              username: otherProf.username
            }
          });
        }
      }
      // Sort recommended students by score descending
      recommendedStudents.sort((a, b) => b.score - a.score);

      // 3. Recommend Projects, Events, Internships, Resources (Query from Posts table)
      const posts = await Post.find({
        isSpam: false,
        isReported: false,
        type: { $in: ['project', 'event', 'internship', 'resource'] }
      }).populate('authorId', 'firstName lastName college branch').limit(100).lean();

      const recProjects = [];
      const recEvents = [];
      const recInternships = [];
      const recResources = [];

      for (const post of posts) {
        let score = 5; // base score
        let reasons = [];

        // Author is same branch
        if (post.authorId && post.authorId.branch === userBranch) {
          score += 15;
        }

        // Content / Tag matches
        const hashtags = (post.hashtags || []).map(h => h.toLowerCase());
        const contentLower = post.content.toLowerCase();

        // Skill/Interest checks
        let matchCount = 0;
        userSkills.forEach(skill => {
          if (hashtags.includes(skill) || contentLower.includes(skill)) matchCount++;
        });
        userInterests.forEach(interest => {
          if (hashtags.includes(interest) || contentLower.includes(interest)) matchCount++;
        });

        score += Math.min(matchCount * 10, 40);
        if (matchCount > 0) {
          reasons.push('Matches your skills/interests');
        }

        // Add quality score weighting
        score += (post.qualityScore || 0) * 0.4;

        const recItem = {
          itemId: post._id,
          score: Math.round(score),
          reason: reasons.join(' • ') || 'Relevance matching',
          title: post.title || post.content.substring(0, 40) + '...',
          authorName: post.authorId ? `${post.authorId.firstName} ${post.authorId.lastName}` : 'CampusX'
        };

        if (post.type === 'project') recProjects.push(recItem);
        else if (post.type === 'event') recEvents.push(recItem);
        else if (post.type === 'internship') recInternships.push(recItem);
        else if (post.type === 'resource') recResources.push(recItem);
      }

      // Sort lists
      const sortByScore = (list) => list.sort((a, b) => b.score - a.score).slice(0, 5);

      const finalProjects = sortByScore(recProjects);
      const finalEvents = sortByScore(recEvents);
      const finalInternships = sortByScore(recInternships);
      const finalResources = sortByScore(recResources);

      // 4. Recommend Communities (Mock catalog mapped to student interests)
      const mockCommunities = [
        { communityId: 'webdev_club', name: 'WebDev Guild', interests: ['web development', 'javascript', 'frontend', 'backend'], description: 'Learn and build modern web apps.' },
        { communityId: 'ai_research', name: 'AI/ML Research Lab', interests: ['ai/ml', 'deep learning', 'pytorch', 'tensorflow', 'python'], description: 'Discussing state of the art in machine learning.' },
        { communityId: 'dsa_squad', name: 'DSA & Competitive Coding', interests: ['dsa', 'leetcode', 'algorithms', 'c++', 'java'], description: 'Mastering placement preparation.' },
        { communityId: 'cyber_sec', name: 'Cyber Security & Hacking', interests: ['cyber security', 'networks', 'security'], description: 'Offensive and defensive security training.' },
        { communityId: 'iot_embed', name: 'IoT & Embedded Robotics', interests: ['iot', 'embedded systems', 'robotics'], description: 'Hardware integration and sensor networking.' },
        { communityId: 'cloud_devops', name: 'Cloud & DevOps Architects', interests: ['cloud', 'devops', 'docker', 'aws'], description: 'Deployments, pipelines, and serverless scaling.' }
      ];

      const recommendedCommunities = [];
      mockCommunities.forEach(c => {
        let matchScore = 0;
        const shared = userInterests.filter(i => c.interests.includes(i));
        if (shared.length > 0) {
          matchScore += shared.length * 25;
        }
        // If interest fits, add
        if (matchScore > 0) {
          recommendedCommunities.push({
            communityId: c.communityId,
            score: matchScore,
            reason: `Matches your interest in: ${shared[0]}`,
            details: { name: c.name, description: c.description }
          });
        }
      });
      recommendedCommunities.sort((a, b) => b.score - a.score);

      // 5. Update Recommendation database cache
      const recData = {
        recommendedStudents: recommendedStudents.slice(0, 5).map(s => ({
          studentId: s.studentId,
          score: s.score,
          reason: s.reason
        })),
        recommendedProjects: finalProjects.map(p => ({ itemId: p.itemId, score: p.score, reason: p.reason })),
        recommendedEvents: finalEvents.map(e => ({ itemId: e.itemId, score: e.score, reason: e.reason })),
        recommendedInternships: finalInternships.map(i => ({ itemId: i.itemId, score: i.score, reason: i.reason })),
        recommendedResources: finalResources.map(r => ({ itemId: r.itemId, score: r.score, reason: r.reason })),
        recommendedCommunities: recommendedCommunities.map(c => ({
          communityId: c.communityId,
          score: c.score,
          reason: c.reason
        }))
      };

      await Recommendation.findOneAndUpdate(
        { userId },
        recData,
        { upsert: true, new: true }
      );

      // 6. Return populated recommendations for controller response
      return {
        students: recommendedStudents.slice(0, 5),
        projects: finalProjects,
        events: finalEvents,
        internships: finalInternships,
        resources: finalResources,
        communities: recommendedCommunities
      };

    } catch (error) {
      console.error('Error in recommendation engine:', error);
      return {};
    }
  }
}

module.exports = RecommendationEngine;
