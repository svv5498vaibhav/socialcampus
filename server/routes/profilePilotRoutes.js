const express = require('express');
const router = express.Router();
const ProfilePilotController = require('../controllers/profilePilotController');
const { authenticate } = require('../middleware/authenticate');
const { profileUpdateValidation } = require('../validators/profileValidators');
const upload = require('../middleware/uploadMiddleware');

// All profile routes require authentication
router.use(authenticate);

// GET /api/profile/me
router.get('/me', ProfilePilotController.getProfile);

// PUT /api/profile/me
router.put('/me', profileUpdateValidation, ProfilePilotController.updateProfile);

// POST /api/profile/avatar
router.post('/avatar', upload.single('avatar'), ProfilePilotController.uploadAvatar);

// DELETE /api/profile/avatar
router.delete('/avatar', ProfilePilotController.deleteAvatar);

// GET /api/profile/completion
router.get('/completion', ProfilePilotController.getCompletion);

// GET /api/profile/recommendations
router.get('/recommendations', ProfilePilotController.getCareerRecommendations);

// POST /api/profile/generate-bio
router.post('/generate-bio', ProfilePilotController.generateBio);

// GET /api/profile/recommended-skills
router.get('/recommended-skills', ProfilePilotController.getRecommendedSkills);

// GET /api/profile/recommended-interests
router.get('/recommended-interests', ProfilePilotController.getRecommendedInterests);

// GET /api/profile/career-roadmap
router.get('/career-roadmap', ProfilePilotController.getCareerRoadmap);

module.exports = router;
