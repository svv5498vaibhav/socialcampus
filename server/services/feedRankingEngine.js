const Profile = require('../models/Profile');
const User = require('../models/User');
const FeedScore = require('../models/FeedScore');
const Recommendation = require('../models/Recommendation');
const TrendingData = require('../models/TrendingData');

class FeedRankingEngine {
  /**
   * Ranks an array of posts for a specific student based on their profile data.
   * 
   * @param {string} userId - ID of the student requesting the feed
   * @param {Array<object>} posts - Array of post documents to rank
   * @returns {Promise<Array<object>>} Ranked posts sorted by score descending
   */
  static async rankPosts(userId, posts = []) {
    if (!posts || posts.length === 0) return [];
    if (!userId) return posts;

    try {
      // 1. Fetch user, profile, recommendations, and trending details once
      const [user, profile, recs, trendingItems] = await Promise.all([
        User.findById(userId).lean(),
        Profile.findOne({ userId }).lean(),
        Recommendation.findOne({ userId }).lean(),
        TrendingData.find({ postId: { $in: posts.map(p => p._id) } }).lean()
      ]);

      if (!user || !profile) {
        return posts; // Fallback to raw posts if profile is not setup
      }

      const userBranch = user.branch || '';
      const userCollege = user.college || '';
      const userSemester = user.semester || '1';
      const userSkills = new Set((profile.skills || []).map(s => s.toLowerCase()));
      const userInterests = new Set((profile.interests || []).map(i => i.toLowerCase()));
      const followingSet = new Set((profile.following || []).map(id => id.toString()));

      // Maps post ID string to trending score
      const trendingMap = new Map();
      if (trendingItems) {
        trendingItems.forEach(item => {
          trendingMap.set(item.postId.toString(), item.trendingScore);
        });
      }

      // Recommended communities set
      const recommendedCommunities = new Set(
        recs && recs.recommendedCommunities ? recs.recommendedCommunities.map(c => c.communityId) : []
      );

      const scoredPosts = [];

      for (const post of posts) {
        let baseRelevance = 10;
        let branchMatch = false;
        let semesterRelevance = 0;
        let skillsOverlap = 0;
        let interestsOverlap = 0;
        let communityMatch = 0;
        let trendingBoost = 0;

        // 2. Author Details (Lookup author's college/branch from post.authorId populated object if available, else skip)
        const author = post.authorId || {};
        const authorBranch = author.branch || '';
        const authorCollege = author.college || '';
        const authorSemester = author.semester || '';

        // Branch Match (+30)
        if (userBranch && authorBranch && userBranch.toLowerCase() === authorBranch.toLowerCase()) {
          baseRelevance += 30;
          branchMatch = true;
        }

        // College Match (+10)
        if (userCollege && authorCollege && userCollege.toLowerCase() === authorCollege.toLowerCase()) {
          baseRelevance += 10;
        }

        // Semester Relevance: Adjacent semesters are more relevant (+15 max)
        if (userSemester && authorSemester) {
          const uSem = parseInt(userSemester, 10);
          const aSem = parseInt(authorSemester, 10);
          if (!isNaN(uSem) && !isNaN(aSem)) {
            const diff = Math.abs(uSem - aSem);
            if (diff === 0) {
              baseRelevance += 15;
              semesterRelevance = 15;
            } else if (diff === 1) {
              baseRelevance += 10;
              semesterRelevance = 10;
            } else if (diff === 2) {
              baseRelevance += 5;
              semesterRelevance = 5;
            }
          }
        }

        // Follow status (+45)
        const authorIdStr = author._id ? author._id.toString() : '';
        if (authorIdStr && followingSet.has(authorIdStr)) {
          baseRelevance += 45;
        }

        // 3. Skills and Interests Overlap
        const postHashtags = (post.hashtags || []).map(h => h.toLowerCase());
        const postContentLower = post.content.toLowerCase();

        // Skill overlap: check tags or text matches
        let skillMatches = 0;
        userSkills.forEach(skill => {
          if (postHashtags.includes(skill) || postContentLower.includes(skill)) {
            skillMatches++;
          }
        });
        skillsOverlap = Math.min(skillMatches * 10, 30);
        baseRelevance += skillsOverlap;

        // Interest overlap
        let interestMatches = 0;
        userInterests.forEach(interest => {
          if (postHashtags.includes(interest) || postContentLower.includes(interest)) {
            interestMatches++;
          }
        });
        interestsOverlap = Math.min(interestMatches * 10, 30);
        baseRelevance += interestsOverlap;

        // 4. Community Match Score (+25)
        // If post contains communityId in metadata, check if it matches recommended communities
        const postCommunityId = post.metadata && post.metadata.communityId;
        if (postCommunityId && recommendedCommunities.has(postCommunityId)) {
          communityMatch = 25;
          baseRelevance += communityMatch;
        }

        // 5. Trending Boost (+15 max)
        const postTrendingScore = trendingMap.get(post._id.toString()) || 0;
        if (postTrendingScore > 0) {
          trendingBoost = Math.min(postTrendingScore * 3, 15);
          baseRelevance += trendingBoost;
        }

        // 6. Quality & Spam Factor
        const qualityWeight = 0.5 + (post.qualityScore || 0) / 200; // range [0.5, 1.0]
        const spamPenalty = 1 - (post.spamScore || 0) / 100; // range [0.0, 1.0]

        // 7. Engagement Factor
        const likes = post.likesCount || 0;
        const comments = post.commentsCount || 0;
        const saves = post.savesCount || 0;
        const shares = post.sharesCount || 0;
        const views = post.viewsCount || 0;
        const engagementWeight = 1 + (likes * 1) + (comments * 3.5) + (saves * 4) + (shares * 5) + (views * 0.05);

        // 8. Time Decay (Gravity decay / Freshness)
        const hoursElapsed = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
        const recencyWeight = 1 / Math.pow(1 + hoursElapsed, 1.5);

        // 9. Final Score Computation
        const finalScore = baseRelevance * qualityWeight * spamPenalty * engagementWeight * recencyWeight;

        // Store details
        scoredPosts.push({
          post,
          score: Math.round(finalScore * 100) / 100, // round to 2 decimals
          factors: {
            branchMatch,
            semesterRelevance,
            skillsOverlap,
            interestsOverlap,
            communityMatch,
            trendingBoost,
            recencyWeight: Math.round(recencyWeight * 100) / 100,
            qualityWeight: Math.round(qualityWeight * 100) / 100,
            engagementWeight: Math.round(engagementWeight * 100) / 100
          }
        });
      }

      // 10. Cache scores asynchronously in the background in MongoDB for faster dashboard stats
      scoredPosts.forEach(sp => {
        FeedScore.findOneAndUpdate(
          { userId, postId: sp.post._id },
          { score: sp.score, factors: sp.factors },
          { upsert: true, new: true }
        ).catch(() => {}); // silent catch to avoid blocking thread
      });

      // 11. Sort by score descending and return the post objects
      scoredPosts.sort((a, b) => b.score - a.score);
      return scoredPosts.map(sp => {
        // Embed the score into the post object for rendering on the UI
        const postObj = sp.post.toObject ? sp.post.toObject() : sp.post;
        return {
          ...postObj,
          feedScore: sp.score,
          feedFactors: sp.factors
        };
      });

    } catch (error) {
      console.error('Error in feed ranking engine:', error);
      return posts; // fallback to raw posts on error
    }
  }
}

module.exports = FeedRankingEngine;
