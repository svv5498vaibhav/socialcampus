const { validationResult } = require('express-validator');
const ProfileService = require('../services/profileService');
const InterestEngine = require('../services/interestEngine');
const SkillEngine = require('../services/skillEngine');
const { sendSuccess, sendError, sendValidationError } = require('../utils/responseUtils');

/**
 * Onboarding Controller
 *
 * Handles the 8-step onboarding wizard flow.
 */
class OnboardingController {
  /**
   * GET /api/onboarding/status
   */
  static async getStatus(req, res, next) {
    try {
      const profile = await ProfileService.getOrCreateProfile(req.user.id);
      const User = require('../models/User');
      const user = await User.findById(req.user.id);

      return sendSuccess(res, {
        message: 'Onboarding status retrieved',
        data: {
          currentStep: profile.onboardingStep,
          completed: profile.onboardingCompleted,
          userData: user ? {
            college: user.college,
            branch: user.branch,
            semester: user.semester,
            firstName: user.firstName,
            lastName: user.lastName,
          } : null,
          profileData: {
            username: profile.username,
            bio: profile.bio,
            interests: profile.interests,
            skills: profile.skills,
            careerGoals: profile.careerGoals,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/onboarding/step/:step
   */
  static async saveStep(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array());
      }

      const step = parseInt(req.params.step, 10);
      if (isNaN(step) || step < 1 || step > 8) {
        return sendError(res, { statusCode: 400, message: 'Invalid step number (1-8)' });
      }

      const profile = await ProfileService.saveOnboardingStep(req.user.id, step, req.body);

      // If step is interests or skills, return AI recommendations for the next step
      let aiSuggestions = null;
      const User = require('../models/User');
      const user = await User.findById(req.user.id);

      if (step === 5 && user) {
        // After semester selection, recommend interests
        aiSuggestions = {
          type: 'interests',
          data: InterestEngine.getRecommendedInterests({
            branch: user.branch,
            semester: user.semester,
            skills: profile.skills || [],
            currentInterests: profile.interests || [],
          }),
        };
      } else if (step === 6 && user) {
        // After interests, recommend skills
        aiSuggestions = {
          type: 'skills',
          data: SkillEngine.getRecommendedSkills({
            branch: user.branch,
            semester: user.semester,
            careerGoals: profile.careerGoals || [],
            currentSkills: profile.skills || [],
          }),
        };
      }

      return sendSuccess(res, {
        message: `Step ${step} saved`,
        data: {
          currentStep: profile.onboardingStep,
          completed: profile.onboardingCompleted,
          aiSuggestions,
        },
      });
    } catch (error) {
      if (error.code === 11000) {
        return sendError(res, { statusCode: 409, message: 'Username is already taken' });
      }
      next(error);
    }
  }

  /**
   * POST /api/onboarding/complete
   */
  static async complete(req, res, next) {
    try {
      const profile = await ProfileService.completeOnboarding(req.user.id);

      return sendSuccess(res, {
        message: 'Onboarding completed! Welcome to CampusX! 🎉',
        data: {
          profileCompletionScore: profile.profileCompletionScore,
          profileLevel: profile.profileLevel,
          generatedBio: profile.generatedBio,
          recommendedCareerPaths: profile.recommendedCareerPaths,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/onboarding/suggestions/interests
   */
  static async getInterestSuggestions(req, res, next) {
    try {
      const User = require('../models/User');
      const user = await User.findById(req.user.id);
      const profile = await ProfileService.getOrCreateProfile(req.user.id);

      const suggestions = InterestEngine.getRecommendedInterests({
        branch: user?.branch || '',
        semester: user?.semester || '1',
        skills: profile.skills || [],
        currentInterests: profile.interests || [],
      });

      return sendSuccess(res, {
        message: 'Interest suggestions retrieved',
        data: suggestions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/onboarding/suggestions/skills
   */
  static async getSkillSuggestions(req, res, next) {
    try {
      const User = require('../models/User');
      const user = await User.findById(req.user.id);
      const profile = await ProfileService.getOrCreateProfile(req.user.id);

      const suggestions = SkillEngine.getRecommendedSkills({
        branch: user?.branch || '',
        semester: user?.semester || '1',
        careerGoals: profile.careerGoals || [],
        currentSkills: profile.skills || [],
      });

      return sendSuccess(res, {
        message: 'Skill suggestions retrieved',
        data: suggestions,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = OnboardingController;
