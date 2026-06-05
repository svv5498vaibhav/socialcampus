const { INTEREST_CATALOG, UNIVERSAL_INTERESTS, SKILL_INTEREST_MAP } = require('../config/interestsData');

/**
 * Interest Detection Engine
 *
 * Recommends interests based on branch, semester, and selected skills.
 * Uses branch-specific catalogs + collaborative filtering from skills.
 */
class InterestEngine {
  /**
   * Get recommended interests for a student
   * @param {Object} params - { branch, semester, skills, currentInterests }
   * @returns {Object} { recommended, universal, all }
   */
  static getRecommendedInterests({ branch, semester, skills = [], currentInterests = [] }) {
    const recommended = new Set();
    const scores = {};

    // 1. Branch-based interests (primary source)
    const branchInterests = INTEREST_CATALOG[branch] || [];
    branchInterests.forEach((interest) => {
      scores[interest] = (scores[interest] || 0) + 3;
      recommended.add(interest);
    });

    // 2. Skill-based collaborative filtering
    skills.forEach((skill) => {
      const relatedInterests = SKILL_INTEREST_MAP[skill] || [];
      relatedInterests.forEach((interest) => {
        scores[interest] = (scores[interest] || 0) + 2;
        recommended.add(interest);
      });
    });

    // 3. Semester-based boosting (early semesters → foundational interests)
    const sem = parseInt(semester, 10) || 1;
    if (sem <= 2) {
      // Boost exploratory interests for freshers
      const exploratoryBoost = ['Hackathons', 'Competitive Programming', 'Open Source', 'Volunteering'];
      exploratoryBoost.forEach((i) => {
        if (recommended.has(i) || UNIVERSAL_INTERESTS.includes(i)) {
          scores[i] = (scores[i] || 0) + 1;
        }
      });
    } else if (sem >= 5) {
      // Boost career-oriented interests for seniors
      const careerBoost = ['Entrepreneurship', 'Startups', 'Research', 'Technical Writing'];
      careerBoost.forEach((i) => {
        scores[i] = (scores[i] || 0) + 1;
      });
    }

    // Remove already selected interests
    currentInterests.forEach((i) => recommended.delete(i));

    // Sort by score
    const sorted = [...recommended]
      .map((name) => ({ name, score: scores[name] || 0 }))
      .sort((a, b) => b.score - a.score)
      .map((item) => item.name);

    // Universal interests (always available)
    const universalFiltered = UNIVERSAL_INTERESTS.filter((i) => !currentInterests.includes(i));

    return {
      recommended: sorted.slice(0, 12),
      universal: universalFiltered,
      all: [...new Set([...sorted, ...universalFiltered])],
    };
  }

  /**
   * Get interests for a specific branch (used in onboarding)
   */
  static getInterestsForBranch(branch) {
    return INTEREST_CATALOG[branch] || [];
  }
}

module.exports = InterestEngine;
