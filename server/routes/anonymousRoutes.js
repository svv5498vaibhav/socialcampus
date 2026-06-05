const express = require('express');
const router = express.Router();
const AnonymousController = require('../controllers/anonymousController');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { anonymousRateLimiter } = require('../middleware/safetyMiddleware');
const {
  createPostValidation,
  reportPostValidation,
  moderatePostValidation,
  resolveEscalationValidation,
} = require('../validators/anonymousValidator');

// All anonymous feed routes require authenticated session
router.use(authenticate);

// Student actions
router.post('/post', anonymousRateLimiter, createPostValidation, AnonymousController.createPost);
router.get('/feed', AnonymousController.getFeed);
router.post('/report', anonymousRateLimiter, reportPostValidation, AnonymousController.reportPost);
router.get('/trending', AnonymousController.getTrendingTopics);
router.get('/categories', AnonymousController.getCategories);
router.get('/sentiment', AnonymousController.getSentimentAnalysis);
router.get('/community-health', AnonymousController.getCommunityHealth);

// Admin / Moderator actions
router.get('/analytics', authorize('admin'), AnonymousController.getAnalytics);
router.post('/admin/moderate', authorize('admin', 'moderator'), moderatePostValidation, AnonymousController.moderatePost);
router.get('/admin/reports', authorize('admin', 'moderator'), AnonymousController.getOpenReports);
router.get('/admin/escalations', authorize('admin', 'moderator'), AnonymousController.getPendingEscalations);
router.post('/admin/escalations/resolve', authorize('admin'), resolveEscalationValidation, AnonymousController.resolveEscalation);

module.exports = router;
