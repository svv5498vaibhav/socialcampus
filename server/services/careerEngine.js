const { CAREER_PATHS, ROADMAP_TEMPLATES, DEFAULT_ROADMAP } = require('../config/careerPathsData');
const LearningRoadmap = require('../models/LearningRoadmap');

/**
 * Career Path Recommendation + Learning Roadmap Engine
 *
 * Recommends career paths by cross-referencing skills, interests, and branch.
 * Generates semester-wise learning roadmaps.
 */
class CareerEngine {
  /**
   * Recommend career paths based on student profile
   * @param {Object} params - { branch, skills, interests }
   * @returns {Array} Ranked career paths with scores
   */
  static recommendCareerPaths({ branch, skills = [], interests = [] }) {
    const skillSet = new Set(skills.map((s) => s.toLowerCase()));
    const interestSet = new Set(interests.map((i) => i.toLowerCase()));

    const scored = CAREER_PATHS.map((path) => {
      let score = 0;

      // Branch alignment (+5)
      if (path.alignedBranches.includes(branch)) {
        score += 5;
      }

      // Skill matches (+3 each)
      path.keySkills.forEach((skill) => {
        if (skillSet.has(skill.toLowerCase())) {
          score += 3;
        }
      });

      // Interest matches (+2 each)
      path.keyInterests.forEach((interest) => {
        if (interestSet.has(interest.toLowerCase())) {
          score += 2;
        }
      });

      // Calculate match percentage
      const maxPossible = 5 + path.keySkills.length * 3 + path.keyInterests.length * 2;
      const matchPercent = Math.round((score / maxPossible) * 100);

      return {
        id: path.id,
        name: path.name,
        icon: path.icon,
        description: path.description,
        score,
        matchPercent,
        matchedSkills: path.keySkills.filter((s) => skillSet.has(s.toLowerCase())),
        matchedInterests: path.keyInterests.filter((i) => interestSet.has(i.toLowerCase())),
        requiredSkills: path.keySkills.filter((s) => !skillSet.has(s.toLowerCase())),
      };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    return scored;
  }

  /**
   * Generate or retrieve a learning roadmap
   * @param {Object} params - { userId, branch, careerGoal }
   * @returns {Object} Semester-wise roadmap
   */
  static async generateRoadmap({ userId, branch, careerGoal }) {
    // Check if roadmap already exists
    let roadmap = await LearningRoadmap.findOne({ userId, careerGoal });
    if (roadmap) return roadmap;

    // Find template
    const template = ROADMAP_TEMPLATES[careerGoal] || DEFAULT_ROADMAP;

    // Create roadmap
    roadmap = await LearningRoadmap.create({
      userId,
      branch,
      careerGoal,
      semesters: template.map((sem) => ({
        semester: sem.semester,
        topics: sem.topics.map((t) => ({
          name: t.name,
          category: t.category,
          priority: t.priority,
          completed: false,
        })),
      })),
    });

    return roadmap;
  }

  /**
   * Get all available career paths (for UI display)
   */
  static getAllCareerPaths() {
    return CAREER_PATHS.map((p) => ({
      id: p.id,
      name: p.name,
      icon: p.icon,
      description: p.description,
    }));
  }

  /**
   * Get top N career path names for storing in profile
   */
  static getTopCareerPathNames({ branch, skills, interests }, count = 3) {
    const ranked = this.recommendCareerPaths({ branch, skills, interests });
    return ranked.slice(0, count).map((p) => p.name);
  }
}

module.exports = CareerEngine;
