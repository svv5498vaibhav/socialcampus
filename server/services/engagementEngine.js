class EngagementEngine {
  /**
   * Assesses a user's churn risk and status based on last activity dates.
   */
  static assessChurnRisk(lastActiveDate) {
    if (!lastActiveDate) {
      return { churnRisk: 'high', status: 'churned' };
    }

    const diffDays = Math.ceil((Date.now() - new Date(lastActiveDate).getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays >= 14) {
      return { churnRisk: 'high', status: 'churned' };
    } else if (diffDays >= 7) {
      return { churnRisk: 'medium', status: 'inactive' };
    } else {
      return { churnRisk: 'low', status: 'active' };
    }
  }

  /**
   * Recommends active engagement actions based on risk and current usage counts.
   */
  static getRetentionStrategies(churnRisk, activityCounts = {}) {
    const strategies = [];

    if (churnRisk === 'high') {
      strategies.push('Send a personalized re-engagement newsletter with top projects from their branch.');
      strategies.push('Trigger a push reminder suggesting peer-learning mentor sessions.');
    } else if (churnRisk === 'medium') {
      strategies.push('Suggest joining a trending technology community to rebuild community score.');
      strategies.push('Highlight upcoming local hackathons and workshops expiring soon.');
    } else {
      // Low risk - increase depth of engagement
      if ((activityCounts.projectsUploaded || 0) === 0) {
        strategies.push('Encourage creating their first project portfolio showcase to build campus reputation.');
      }
      if ((activityCounts.resourcesShared || 0) === 0) {
        strategies.push('Promote sharing study materials or lecture notes to earn contributor badges.');
      }
      strategies.push('Check the leaderboards to view their branch-level rankings.');
    }

    return strategies;
  }
}

module.exports = EngagementEngine;
