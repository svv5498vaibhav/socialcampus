class GrowthCalculator {
  /**
   * Compiles the growth metrics metrics for a user based on profile completeness, skills, and activities.
   */
  static calculateScores(profileData, activityCounts = {}) {
    // 1. Profile Growth Score (comprises bio, avatar, skills, interests, certifications)
    let profileScore = 0;
    if (profileData.bio && profileData.bio.length > 5) profileScore += 20;
    if (profileData.avatarUrl && profileData.avatarUrl.length > 0) profileScore += 20;
    if (profileData.skills && profileData.skills.length > 0) profileScore += 20;
    if (profileData.interests && profileData.interests.length > 0) profileScore += 20;
    if (profileData.certifications && profileData.certifications.length > 0) profileScore += 20;

    // 2. Skill Growth Score (based on total skills acquired)
    const skillsCount = profileData.skills ? profileData.skills.length : 0;
    let skillScore = 0;
    if (skillsCount >= 5) skillScore = 100;
    else if (skillsCount >= 3) skillScore = 75;
    else if (skillsCount >= 1) skillScore = 40;

    // 3. Contribution Growth Score (aggregates resources shared, projects and posts)
    const projectsCount = (profileData.projects || []).length;
    const resourcesCount = activityCounts.resourcesShared || 0;
    const postsCount = activityCounts.postsCreated || 0;
    
    let contributionScore = (projectsCount * 35) + (resourcesCount * 15) + (postsCount * 5);
    contributionScore = Math.min(100, Math.max(10, contributionScore));

    // 4. Community Growth Score (checks communities joined and follower counts)
    const communitiesCount = activityCounts.communitiesJoined || 0;
    const followersCount = profileData.followers ? profileData.followers.length : 0;
    
    let communityScore = (communitiesCount * 25) + (followersCount * 10);
    communityScore = Math.min(100, Math.max(10, communityScore));

    // 5. Career Readiness Index (weighted composite score)
    const careerScore = Math.round(
      (profileScore * 0.20) +
      (skillScore * 0.30) +
      (contributionScore * 0.30) +
      (communityScore * 0.20)
    );

    return {
      profileGrowthScore: profileScore,
      skillGrowthScore: skillScore,
      contributionGrowthScore: contributionScore,
      communityGrowthScore: communityScore,
      careerReadinessScore: Math.min(100, careerScore),
    };
  }
}

module.exports = GrowthCalculator;
