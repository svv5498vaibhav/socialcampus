const express = require('express');
const router = express.Router();
const CreatorController = require('../controllers/creatorController');
const { authenticate } = require('../middleware/authenticate');
const {
  publishProjectValidation,
  publishContentPostValidation,
  uploadResourceValidation,
  trackEngagementValidation,
} = require('../validators/creatorValidator');

// All creator routes require authentication
router.use(authenticate);

// Project Showcase
router.post('/projects', publishProjectValidation, CreatorController.publishProject);
router.get('/projects/:projectId', CreatorController.getProjectDetails);
router.get('/projects', CreatorController.listProjects);

// Content Posts (Blogs, Achievements, etc.)
router.post('/posts', publishContentPostValidation, CreatorController.publishContentPost);
router.get('/posts/:postId', CreatorController.getContentPost);
router.get('/posts', CreatorController.listContentPosts);
router.post('/posts/:postId/like', CreatorController.likePost);

// AI Assistant
router.post('/helper/suggestions', CreatorController.getAIAssistantSuggestions);

// Resources
router.post('/resources', uploadResourceValidation, CreatorController.uploadResource);
router.get('/resources/:resourceId/download', CreatorController.downloadResource);
router.get('/resources', CreatorController.listResources);

// Real-Time Hover & Duration Analytics
router.post('/analytics/track', trackEngagementValidation, CreatorController.trackPostMetrics);
router.get('/analytics/dashboard', CreatorController.getDashboard);
router.get('/analytics/post/:postId', CreatorController.getPostAnalyticsDetails);

module.exports = router;
