const Profile = require('../models/Profile');
const User = require('../models/User');
const InterestEngine = require('./interestEngine');
const SkillEngine = require('./skillEngine');
const BioEngine = require('./bioEngine');
const CareerEngine = require('./careerEngine');

/**
 * Profile Service
 *
 * Manages profile CRUD, onboarding orchestration,
 * and profile completion scoring.
 */
class ProfileService {
  // ── Completion Score Weights ──
  static COMPLETION_WEIGHTS = {
    avatarUrl: 10,
    bio: 10,
    skills: 15,
    interests: 10,
    projects: 20,
    certifications: 10,
    achievements: 10,
    careerGoals: 10,
    username: 5,
  };

  /**
   * Get or create profile for a user
   */
  static async getOrCreateProfile(userId) {
    let profile = await Profile.findOne({ userId });
    if (!profile) {
      profile = await Profile.create({ userId });
    }
    return profile;
  }

  /**
   * Get full profile with user data
   */
  static async getFullProfile(userId) {
    const [profile, user] = await Promise.all([
      this.getOrCreateProfile(userId),
      User.findById(userId),
    ]);

    return {
      ...profile.toObject(),
      user: user ? {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        college: user.college,
        branch: user.branch,
        semester: user.semester,
        rollNumber: user.rollNumber,
      } : null,
    };
  }

  /**
   * Save onboarding step data
   */
  static async saveOnboardingStep(userId, step, data) {
    const profile = await this.getOrCreateProfile(userId);
    const user = await User.findById(userId);

    switch (step) {
      case 1: // Welcome — no data to save
        break;
      case 2: // College — already in User from registration
        if (data.college && user) {
          user.college = data.college;
          await user.save();
        }
        break;
      case 3: // Branch
        if (data.branch && user) {
          user.branch = data.branch;
          await user.save();
        }
        break;
      case 4: // Personal Details
        if (data.username) profile.username = data.username;
        if (data.bio) profile.bio = data.bio;
        if (data.avatarUrl) profile.avatarUrl = data.avatarUrl;
        break;
      case 5: // Year & Semester
        if (data.semester && user) {
          user.semester = data.semester;
          await user.save();
        }
        break;
      case 6: // Interests
        if (data.interests) profile.interests = data.interests;
        break;
      case 7: // Skills
        if (data.skills) profile.skills = data.skills;
        if (data.careerGoals) profile.careerGoals = data.careerGoals;
        break;
      case 8: // Completion
        profile.onboardingCompleted = true;
        if (user) {
          user.onboardingCompleted = true;
          await user.save();
        }
        break;
    }

    // Update step tracker
    profile.onboardingStep = Math.max(profile.onboardingStep, step);
    await profile.save();

    // On completion, run AI engines
    if (step === 8) {
      await this.runAIEnrichment(userId);
    }

    return profile;
  }

  /**
   * Complete onboarding — finalize profile
   */
  static async completeOnboarding(userId) {
    const profile = await this.getOrCreateProfile(userId);
    profile.onboardingCompleted = true;
    profile.onboardingStep = 8;
    await profile.save();

    const user = await User.findById(userId);
    if (user) {
      user.onboardingCompleted = true;
      await user.save();
    }

    await this.runAIEnrichment(userId);
    return profile;
  }

  /**
   * Run AI enrichment on profile (bio, career paths, completion score)
   */
  static async runAIEnrichment(userId) {
    const profile = await Profile.findOne({ userId });
    const user = await User.findById(userId);
    if (!profile || !user) return;

    // Generate bio
    const bio = BioEngine.generateBio({
      firstName: user.firstName,
      lastName: user.lastName,
      branch: user.branch,
      college: user.college,
      semester: user.semester,
      skills: profile.skills,
      interests: profile.interests,
      careerGoals: profile.careerGoals,
      projects: profile.projects,
      achievements: profile.achievements,
    });
    profile.generatedBio = bio;
    if (!profile.bio) profile.bio = bio;

    // Recommend career paths
    const topPaths = CareerEngine.getTopCareerPathNames({
      branch: user.branch,
      skills: profile.skills,
      interests: profile.interests,
    });
    profile.recommendedCareerPaths = topPaths;

    // Calculate completion score
    this.calculateCompletionScore(profile);

    await profile.save();
  }

  /**
   * Calculate profile completion score (0-100)
   */
  static calculateCompletionScore(profile) {
    let score = 0;
    const w = this.COMPLETION_WEIGHTS;

    if (profile.avatarUrl) score += w.avatarUrl;
    if (profile.bio && profile.bio.length >= 20) score += w.bio;
    if (profile.skills && profile.skills.length >= 3) score += w.skills;
    else if (profile.skills && profile.skills.length >= 1) score += Math.floor(w.skills * (profile.skills.length / 3));
    if (profile.interests && profile.interests.length >= 2) score += w.interests;
    else if (profile.interests && profile.interests.length >= 1) score += Math.floor(w.interests / 2);
    if (profile.projects && profile.projects.length >= 1) score += w.projects;
    if (profile.certifications && profile.certifications.length >= 1) score += w.certifications;
    if (profile.achievements && profile.achievements.length >= 1) score += w.achievements;
    if (profile.careerGoals && profile.careerGoals.length >= 1) score += w.careerGoals;
    if (profile.username) score += w.username;

    profile.profileCompletionScore = Math.min(score, 100);

    // Set level
    if (score >= 76) profile.profileLevel = 'campus_pro';
    else if (score >= 51) profile.profileLevel = 'advanced';
    else if (score >= 26) profile.profileLevel = 'intermediate';
    else profile.profileLevel = 'beginner';

    return { score: profile.profileCompletionScore, level: profile.profileLevel };
  }

  /**
   * Update profile fields
   */
  static async updateProfile(userId, updates) {
    const profile = await this.getOrCreateProfile(userId);
    const allowedFields = [
      'username', 'bio', 'avatarUrl', 'skills', 'interests',
      'projects', 'certifications', 'achievements',
      'careerGoals', 'preferredDomains', 'internshipInterests', 'higherEducationGoals',
    ];

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        profile[field] = updates[field];
      }
    });

    this.calculateCompletionScore(profile);
    await profile.save();

    // Re-run AI if key fields changed
    if (updates.skills || updates.interests || updates.careerGoals) {
      await this.runAIEnrichment(userId);
    }

    return profile;
  }

  /**
   * Get completion status
   */
  static async getCompletionStatus(userId) {
    const profile = await this.getOrCreateProfile(userId);
    const { score, level } = this.calculateCompletionScore(profile);
    await profile.save();

    const w = this.COMPLETION_WEIGHTS;
    const checklist = [
      { item: 'Profile Photo', completed: !!profile.avatarUrl, points: w.avatarUrl },
      { item: 'Bio', completed: !!(profile.bio && profile.bio.length >= 20), points: w.bio },
      { item: 'Skills (3+)', completed: profile.skills?.length >= 3, points: w.skills },
      { item: 'Interests (2+)', completed: profile.interests?.length >= 2, points: w.interests },
      { item: 'Project (1+)', completed: profile.projects?.length >= 1, points: w.projects },
      { item: 'Certification (1+)', completed: profile.certifications?.length >= 1, points: w.certifications },
      { item: 'Achievement (1+)', completed: profile.achievements?.length >= 1, points: w.achievements },
      { item: 'Career Goal', completed: profile.careerGoals?.length >= 1, points: w.careerGoals },
      { item: 'Username', completed: !!profile.username, points: w.username },
    ];

    return { score, level, checklist };
  }
}

module.exports = ProfileService;
