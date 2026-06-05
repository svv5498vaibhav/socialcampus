const Profile = require('../models/Profile');
const User = require('../models/User');

class CareerInsightsEngine {
  static getStandardCareerPaths() {
    return {
      'Full Stack Developer': {
        skills: ['javascript', 'react', 'node.js', 'mongodb', 'express', 'git', 'html', 'css'],
        roadmaps: ['Master modern JavaScript (ES6+)', 'Build responsive UI using React', 'Design RESTful APIs with Node & Express', 'Persist data in MongoDB', 'Deploy code using git workflows'],
      },
      'Data Scientist / AI Engineer': {
        skills: ['python', 'sql', 'pandas', 'numpy', 'machine learning', 'tensorflow', 'pytorch', 'scikit-learn'],
        roadmaps: ['Learn basic Python syntax and database query structures', 'Clean datasets using Pandas & NumPy', 'Understand statistical algorithms with Scikit-learn', 'Build deep learning neural nets in PyTorch/TensorFlow'],
      },
      'DevOps Engineer': {
        skills: ['docker', 'kubernetes', 'ci/cd', 'git', 'linux', 'aws', 'bash', 'jenkins'],
        roadmaps: ['Master Git version control & Linux command line', 'Containerize services using Docker', 'Orchestrate deployments with Kubernetes', 'Automate code building via CI/CD pipelines', 'Manage hosting inside AWS'],
      },
    };
  }

  /**
   * Evaluates user profile and returns career recommendations, skill gaps, and custom roadmaps.
   */
  static analyzeProfile(userDetails, userProfile) {
    const userSkills = (userProfile.skills || []).map(s => s.toLowerCase().trim());
    const userSkillsSet = new Set(userSkills);

    const standardPaths = CareerInsightsEngine.getStandardCareerPaths();
    const recommendations = [];
    const gapsAnalysis = {
      identifiedGaps: [],
      suggestions: [],
      roadmapsSuggested: [],
      growthOpportunities: [],
    };

    for (const [pathTitle, data] of Object.entries(standardPaths)) {
      const pathSkills = data.skills;
      const matched = pathSkills.filter(skill => userSkillsSet.has(skill));
      
      const matchPercent = pathSkills.length > 0 ? Math.round((matched.length / pathSkills.length) * 100) : 0;
      
      // Calculate missing skills
      const missingSkills = pathSkills.filter(skill => !userSkillsSet.has(skill));

      recommendations.push({
        pathTitle,
        matchPercent: Math.max(10, matchPercent), // floor of 10%
        reasoning: `Matched ${matched.length} out of ${pathSkills.length} core competencies for ${pathTitle}.`,
        status: 'active',
      });

      // Suggest roadmap steps for the path with highest match
      if (missingSkills.length > 0) {
        gapsAnalysis.identifiedGaps.push(...missingSkills.map(s => `Skill gap in target ${pathTitle}: Missing ${s.toUpperCase()}`));
        
        gapsAnalysis.suggestions.push(
          `To improve your match for ${pathTitle}, try building a project with ${missingSkills[0].toUpperCase()}.`
        );
        
        gapsAnalysis.roadmapsSuggested.push({
          title: `Personalized ${pathTitle} Roadmap`,
          steps: [
            ...data.roadmaps.slice(0, 2),
            `Bridge gap: Acquire the skill ${missingSkills[0].toUpperCase()}`,
            ...data.roadmaps.slice(2),
          ],
          completed: false,
        });
      }
    }

    // Sort paths by compatibility percentage descending
    recommendations.sort((a, b) => b.matchPercent - a.matchPercent);

    // Dynamic suggestions based on overall profile completeness
    const completeness = userProfile.profileCompletionScore || 0;
    if (completeness < 80) {
      gapsAnalysis.suggestions.push('Complete your profile sections (avatar, bio, certifications) to increase campus visibility.');
    }
    if ((userProfile.projects || []).length === 0) {
      gapsAnalysis.suggestions.push('Upload your first project showcase to demonstrate your coding capabilities.');
      gapsAnalysis.growthOpportunities.push('Participate in the upcoming CampusX Hackathon to build and launch a team project.');
    } else {
      gapsAnalysis.growthOpportunities.push('Share your project documentation in technology communities to collect feedback.');
    }

    return {
      recommendations,
      insights: {
        identifiedGaps: [...new Set(gapsAnalysis.identifiedGaps)].slice(0, 6),
        suggestions: [...new Set(gapsAnalysis.suggestions)].slice(0, 4),
        roadmapsSuggested: gapsAnalysis.roadmapsSuggested.slice(0, 2),
        growthOpportunities: [...new Set(gapsAnalysis.growthOpportunities)].slice(0, 3),
      },
    };
  }
}

module.exports = CareerInsightsEngine;
