/**
 * Bio Generator Engine
 *
 * Generates professional student bios using template-based generation
 * with profile data interpolation.
 */
class BioEngine {
  static TEMPLATES = [
    (d) => `${d.name} is a ${d.year}-year ${d.branch} student at ${d.college}, passionate about ${d.interests}. Skilled in ${d.skills}${d.goals ? `, with career aspirations in ${d.goals}` : ''}.`,

    (d) => `Aspiring ${d.goalTitle || 'technologist'} pursuing ${d.branch} at ${d.college}. ${d.name} brings expertise in ${d.skills} and a keen interest in ${d.interests}.${d.projects ? ` Currently working on ${d.projects}.` : ''}`,

    (d) => `${d.branch} student at ${d.college} | ${d.interests}. ${d.name} is building skills in ${d.skills} and actively exploring opportunities in ${d.goals || 'the tech industry'}.`,

    (d) => `🎓 ${d.year}-year ${d.branch} @ ${d.college}\n💡 Interested in ${d.interests}\n🛠️ Skills: ${d.skills}${d.goals ? `\n🎯 Goal: ${d.goals}` : ''}`,

    (d) => `${d.name}, a ${d.branch} student at ${d.college}, combines knowledge of ${d.skills} with a passion for ${d.interests}. ${d.achievementLine}`,

    (d) => `Driven ${d.branch} undergraduate at ${d.college}, specializing in ${d.interests}. Proficient in ${d.skills}, ${d.name} is committed to ${d.goals || 'continuous learning and innovation'}.`,
  ];

  /**
   * Generate a professional bio from profile data
   * @param {Object} data - { firstName, lastName, branch, college, semester, skills, interests, careerGoals, projects, achievements }
   * @returns {string} Generated bio
   */
  static generateBio(data) {
    const {
      firstName = '',
      lastName = '',
      branch = '',
      college = '',
      semester = '1',
      skills = [],
      interests = [],
      careerGoals = [],
      projects = [],
      achievements = [],
    } = data;

    const name = `${firstName} ${lastName}`.trim() || 'Student';
    const sem = parseInt(semester, 10) || 1;
    const year = Math.ceil(sem / 2);
    const yearStr = ['First', 'Second', 'Third', 'Fourth'][year - 1] || `${year}th`;

    // Format lists with natural language
    const formatList = (arr, max = 3) => {
      const items = arr.slice(0, max);
      if (items.length === 0) return 'various technologies';
      if (items.length === 1) return items[0];
      if (items.length === 2) return `${items[0]} and ${items[1]}`;
      return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
    };

    const templateData = {
      name,
      year: yearStr,
      branch: branch || 'Engineering',
      college: college || 'University',
      skills: formatList(skills),
      interests: formatList(interests),
      goals: careerGoals.length > 0 ? formatList(careerGoals) : '',
      goalTitle: careerGoals[0] || '',
      projects: projects.length > 0 ? projects[0].title : '',
      achievementLine: achievements.length > 0
        ? `Notable achievement: ${achievements[0].title}.`
        : 'Actively building projects and exploring modern technologies.',
    };

    // Select a random template
    const templateIndex = Math.floor(Math.random() * this.TEMPLATES.length);
    const bio = this.TEMPLATES[templateIndex](templateData);

    return bio.trim();
  }

  /**
   * Generate multiple bio options for the user to choose
   */
  static generateBioOptions(data, count = 3) {
    const bios = [];
    const usedIndices = new Set();

    while (bios.length < count && usedIndices.size < this.TEMPLATES.length) {
      const index = Math.floor(Math.random() * this.TEMPLATES.length);
      if (!usedIndices.has(index)) {
        usedIndices.add(index);

        const name = `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Student';
        const sem = parseInt(data.semester, 10) || 1;
        const year = Math.ceil(sem / 2);
        const yearStr = ['First', 'Second', 'Third', 'Fourth'][year - 1] || `${year}th`;

        const formatList = (arr, max = 3) => {
          const items = arr.slice(0, max);
          if (items.length === 0) return 'various technologies';
          if (items.length === 1) return items[0];
          if (items.length === 2) return `${items[0]} and ${items[1]}`;
          return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
        };

        const templateData = {
          name,
          year: yearStr,
          branch: data.branch || 'Engineering',
          college: data.college || 'University',
          skills: formatList(data.skills || []),
          interests: formatList(data.interests || []),
          goals: (data.careerGoals || []).length > 0 ? formatList(data.careerGoals) : '',
          goalTitle: (data.careerGoals || [])[0] || '',
          projects: (data.projects || []).length > 0 ? data.projects[0].title : '',
          achievementLine: (data.achievements || []).length > 0
            ? `Notable achievement: ${data.achievements[0].title}.`
            : 'Actively building projects and exploring modern technologies.',
        };

        bios.push(this.TEMPLATES[index](templateData).trim());
      }
    }

    return bios;
  }
}

module.exports = BioEngine;
