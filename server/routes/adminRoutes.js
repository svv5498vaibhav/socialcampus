const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

// All admin routes require authentication + admin role
router.use(authenticate, authorize('admin'));

// GET /api/admin/users
router.get('/users', AdminController.getUsers);

// GET /api/admin/users/:id
router.get('/users/:id', AdminController.getUserDetail);

// PATCH /api/admin/users/:id/block
router.patch('/users/:id/block', AdminController.blockUser);

// PATCH /api/admin/users/:id/suspend
router.patch('/users/:id/suspend', AdminController.suspendUser);

// GET /api/admin/fraud-alerts
router.get('/fraud-alerts', AdminController.getFraudAlerts);

// GET /api/admin/security-logs
router.get('/security-logs', AdminController.getSecurityLogs);

// GET /api/admin/stats
router.get('/stats', AdminController.getDashboardStats);

// ProfilePilot Analytics
// GET /api/admin/profile-analytics
router.get('/profile-analytics', AdminController.getProfileAnalytics);

// GET /api/admin/skill-trends
router.get('/skill-trends', AdminController.getSkillTrends);

// GET /api/admin/interest-trends
router.get('/interest-trends', AdminController.getInterestTrends);

// FeedSense AI Admin Moderation & Analytics
router.get('/feed/reports', AdminController.getReportedPosts);
router.delete('/feed/posts/:postId', AdminController.deletePost);
router.post('/feed/posts/:postId/dismiss', AdminController.dismissReport);
router.get('/feed/spam', AdminController.getSpamAlerts);
router.get('/feed/performance', AdminController.getFeedPerformance);

module.exports = router;
