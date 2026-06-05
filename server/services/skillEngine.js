const { SKILL_CATALOG, getSemesterTier, getTiersUpTo, CAREER_SKILL_BOOST } = require('../config/skillsData');

/**
 * Skill Recommendation Engine
 *
 * Recommends skills based on branch, semester, and career goals.
 * Semester-aware: only recommends skills at or below current tier.
 */
class SkillEngine {
  /**
   * Get recommended skills for a student
   * @param {Object} params - { branch, semester, careerGoals, currentSkills }
   * @returns {Object} { recommended, byTier, careerBoosted }
   */
  static getRecommendedSkills({ branch, semester, careerGoals = [], currentSkills = [] }) {
    const branchSkills = SKILL_CATALOG[branch];
    const scores = {};
    const currentSet = new Set(currentSkills.map((s) => s.toLowerCase()));

    // 1. Collect skills from all tiers up to current semester
    const tiers = getTiersUpTo(semester);
    const byTier = {};

    if (branchSkills) {
      tiers.forEach((tier) => {
        const tierSkills = branchSkills[tier] || [];
        byTier[tier] = [];
        tierSkills.forEach((skill) => {
          if (!currentSet.has(skill.toLowerCase())) {
            scores[skill] = (scores[skill] || 0) + 3;
            byTier[tier].push(skill);
          }
        });
      });
    }

    // 2. Career goal boosting
    const careerBoosted = [];
    careerGoals.forEach((goal) => {
      const boostSkills = CAREER_SKILL_BOOST[goal] || [];
      boostSkills.forEach((skill) => {
        if (!currentSet.has(skill.toLowerCase())) {
          scores[skill] = (scores[skill] || 0) + 2;
          careerBoosted.push(skill);
        }
      });
    });

    // 3. Current tier emphasis (boost current tier skills higher)
    const currentTier = getSemesterTier(semester);
    if (branchSkills && branchSkills[currentTier]) {
      branchSkills[currentTier].forEach((skill) => {
        if (!currentSet.has(skill.toLowerCase())) {
          scores[skill] = (scores[skill] || 0) + 2; // extra boost for current tier
        }
      });
    }

    // Sort all recommended by score
    const allRecommended = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);

    return {
      recommended: allRecommended.slice(0, 15),
      byTier,
      careerBoosted: [...new Set(careerBoosted)].slice(0, 10),
      currentTier,
    };
  }

  /**
   * Get skills for a specific branch and tier (used in onboarding)
   */
  static getSkillsForBranch(branch) {
    const branchSkills = SKILL_CATALOG[branch];
    if (!branchSkills) return [];

    // Flatten all tiers
    return [...new Set(Object.values(branchSkills).flat())];
  }

  /**
   * Get skills for a specific tier
   */
  static getSkillsForTier(branch, tier) {
    const branchSkills = SKILL_CATALOG[branch];
    if (!branchSkills) return [];
    return branchSkills[tier] || [];
  }
}

module.exports = SkillEngine;
