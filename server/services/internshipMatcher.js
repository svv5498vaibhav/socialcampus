class InternshipMatcher {
  static getOpportunityCatalog() {
    return [
      {
        title: 'Software Developer Intern',
        company: 'Google',
        type: 'internship',
        skillsRequired: ['javascript', 'react', 'git'],
        branch: 'CSE',
        url: 'https://careers.google.com',
        deadlineDays: 14,
      },
      {
        title: 'AI Research Associate',
        company: 'OpenAI',
        type: 'internship',
        skillsRequired: ['python', 'machine learning', 'tensorflow'],
        branch: 'CSE',
        url: 'https://openai.com/careers',
        deadlineDays: 7,
      },
      {
        title: 'Full Stack Engineer',
        company: 'CampusX Tech',
        type: 'job',
        skillsRequired: ['javascript', 'node.js', 'mongodb', 'react'],
        branch: 'CSE',
        url: 'https://campusx.in/jobs',
        deadlineDays: 30,
      },
      {
        title: 'Cloud Infrastructure Intern',
        company: 'Amazon Web Services',
        type: 'internship',
        skillsRequired: ['docker', 'kubernetes', 'aws', 'git'],
        branch: 'CSE',
        url: 'https://amazon.jobs',
        deadlineDays: 21,
      },
      {
        title: 'Global Hackathon Coding Challenge',
        company: 'CampusX HQ',
        type: 'hackathon',
        skillsRequired: ['javascript', 'python', 'git'],
        branch: 'any',
        url: 'https://campusx.in/hackathon',
        deadlineDays: 5,
      },
      {
        title: 'Docker & Microservices Workshop',
        company: 'Linux Foundation',
        type: 'workshop',
        skillsRequired: ['docker', 'linux'],
        branch: 'any',
        url: 'https://training.linuxfoundation.org',
        deadlineDays: 10,
      },
    ];
  }

  /**
   * Evaluates opportunities catalog against user profile.
   */
  static matchOpportunities(userId, userDetails, userProfile) {
    const userSkills = (userProfile.skills || []).map(s => s.toLowerCase().trim());
    const userSkillsSet = new Set(userSkills);
    const userBranch = (userDetails.branch || '').toUpperCase();
    const userInterests = (userProfile.interests || []).map(i => i.toLowerCase().trim());

    const catalog = InternshipMatcher.getOpportunityCatalog();
    const recommendations = [];

    for (const opp of catalog) {
      let score = 0;

      // 1. Skills overlap (up to 50 pts)
      const oppSkills = opp.skillsRequired;
      const matchedSkills = oppSkills.filter(s => userSkillsSet.has(s));
      if (oppSkills.length > 0) {
        score += Math.round((matchedSkills.length / oppSkills.length) * 50);
      }

      // 2. Branch matching (up to 30 pts)
      if (opp.branch === 'any') {
        score += 30;
      } else if (opp.branch.toUpperCase() === userBranch) {
        score += 30;
      } else {
        score += 5; // minimal alignment
      }

      // 3. Interests alignment (up to 20 pts)
      const titleLower = opp.title.toLowerCase();
      const companyLower = opp.company.toLowerCase();
      const matchesInterest = userInterests.some(interest =>
        titleLower.includes(interest) || companyLower.includes(interest)
      );
      if (matchesInterest) {
        score += 20;
      } else {
        score += 10;
      }

      if (score >= 20) {
        const deadlineDate = new Date();
        deadlineDate.setDate(deadlineDate.getDate() + opp.deadlineDays);

        recommendations.push({
          userId,
          title: opp.title,
          company: opp.company,
          type: opp.type,
          deadline: deadlineDate,
          url: opp.url,
          skillsRequired: opp.skillsRequired,
          matchScore: Math.min(score, 100),
          status: 'active',
        });
      }
    }

    return recommendations.sort((a, b) => b.matchScore - a.matchScore);
  }
}

module.exports = InternshipMatcher;
