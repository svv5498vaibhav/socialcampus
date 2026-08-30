const { validationResult } = require('express-validator');
const ProfileService = require('../services/profileService');
const InterestEngine = require('../services/interestEngine');
const SkillEngine = require('../services/skillEngine');
const BioEngine = require('../services/bioEngine');
const CareerEngine = require('../services/careerEngine');
const { sendSuccess, sendError, sendValidationError } = require('../utils/responseUtils');

/**
 * ProfilePilot Controller
 *
 * Handles profile CRUD, AI recommendations, and career roadmaps.
 */
class ProfilePilotController {
  /**
   * GET /api/profile/me
   */
  static async getProfile(req, res, next) {
    try {
      const profile = await ProfileService.getFullProfile(req.user.id);
      return sendSuccess(res, {
        message: 'Profile retrieved',
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/profile/me
   */
  static async updateProfile(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array());
      }

      const profile = await ProfileService.updateProfile(req.user.id, req.body);
      return sendSuccess(res, {
        message: 'Profile updated',
        data: profile,
      });
    } catch (error) {
      if (error.code === 11000) {
        return sendError(res, { statusCode: 409, message: 'Username is already taken' });
      }
      next(error);
    }
  }

  /**
   * GET /api/profile/completion
   */
  static async getCompletion(req, res, next) {
    try {
      const status = await ProfileService.getCompletionStatus(req.user.id);
      return sendSuccess(res, {
        message: 'Completion status retrieved',
        data: status,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/profile/recommendations
   */
  static async getCareerRecommendations(req, res, next) {
    try {
      const User = require('../models/User');
      const user = await User.findById(req.user.id);
      const profile = await ProfileService.getOrCreateProfile(req.user.id);

      const careerPaths = CareerEngine.recommendCareerPaths({
        branch: user?.branch || '',
        skills: profile.skills || [],
        interests: profile.interests || [],
      });

      return sendSuccess(res, {
        message: 'Career recommendations retrieved',
        data: { careerPaths },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/profile/generate-bio
   */
  static async generateBio(req, res, next) {
    try {
      const User = require('../models/User');
      const user = await User.findById(req.user.id);
      const profile = await ProfileService.getOrCreateProfile(req.user.id);

      const bios = BioEngine.generateBioOptions({
        firstName: user?.firstName,
        lastName: user?.lastName,
        branch: user?.branch,
        college: user?.college,
        semester: user?.semester,
        skills: profile.skills || [],
        interests: profile.interests || [],
        careerGoals: profile.careerGoals || [],
        projects: profile.projects || [],
        achievements: profile.achievements || [],
      }, 3);

      return sendSuccess(res, {
        message: 'Bio options generated',
        data: { bios },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/profile/recommended-skills
   */
  static async getRecommendedSkills(req, res, next) {
    try {
      const User = require('../models/User');
      const user = await User.findById(req.user.id);
      const profile = await ProfileService.getOrCreateProfile(req.user.id);

      const skills = SkillEngine.getRecommendedSkills({
        branch: user?.branch || '',
        semester: user?.semester || '1',
        careerGoals: profile.careerGoals || [],
        currentSkills: profile.skills || [],
      });

      return sendSuccess(res, {
        message: 'Recommended skills retrieved',
        data: skills,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/profile/recommended-interests
   */
  static async getRecommendedInterests(req, res, next) {
    try {
      const User = require('../models/User');
      const user = await User.findById(req.user.id);
      const profile = await ProfileService.getOrCreateProfile(req.user.id);

      const interests = InterestEngine.getRecommendedInterests({
        branch: user?.branch || '',
        semester: user?.semester || '1',
        skills: profile.skills || [],
        currentInterests: profile.interests || [],
      });

      return sendSuccess(res, {
        message: 'Recommended interests retrieved',
        data: interests,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/profile/career-roadmap
   */
  static async getCareerRoadmap(req, res, next) {
    try {
      const User = require('../models/User');
      const user = await User.findById(req.user.id);
      const profile = await ProfileService.getOrCreateProfile(req.user.id);

      const careerGoal = req.query.goal || (profile.careerGoals && profile.careerGoals[0]) || 'Web Development';

      const roadmap = await CareerEngine.generateRoadmap({
        userId: req.user.id,
        branch: user?.branch || '',
        careerGoal,
      });

      return sendSuccess(res, {
        message: 'Career roadmap retrieved',
        data: roadmap,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/profile/avatar
   */
  static async uploadAvatar(req, res, next) {
    try {
      if (!req.file) {
        return sendError(res, { statusCode: 400, message: 'No image file provided' });
      }

      const result = await ProfileService.uploadAvatar(
        req.user.id,
        req.file.buffer,
        req.file.mimetype
      );

      return sendSuccess(res, {
        message: 'Avatar uploaded successfully',
        data: result,
      });
    } catch (error) {
      if (error.message === 'Only image files are allowed') {
        return sendError(res, { statusCode: 400, message: error.message });
      }
      next(error);
    }
  }

  /**
   * DELETE /api/profile/avatar
   */
  static async deleteAvatar(req, res, next) {
    try {
      const result = await ProfileService.deleteAvatar(req.user.id);

      return sendSuccess(res, {
        message: 'Avatar removed successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProfilePilotController;
