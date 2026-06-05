const express = require('express');
const router = express.Router();
const OnboardingController = require('../controllers/onboardingController');
const { authenticate } = require('../middleware/authenticate');
const { onboardingStepValidation } = require('../validators/profileValidators');

// All onboarding routes require authentication
router.use(authenticate);

// GET /api/onboarding/status
router.get('/status', OnboardingController.getStatus);

// POST /api/onboarding/step/:step
router.post('/step/:step', onboardingStepValidation, OnboardingController.saveStep);

// POST /api/onboarding/complete
router.post('/complete', OnboardingController.complete);

// GET /api/onboarding/suggestions/interests
router.get('/suggestions/interests', OnboardingController.getInterestSuggestions);

// GET /api/onboarding/suggestions/skills
router.get('/suggestions/skills', OnboardingController.getSkillSuggestions);

module.exports = router;
