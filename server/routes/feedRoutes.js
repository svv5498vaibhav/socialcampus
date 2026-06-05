const express = require('express');
const router = express.Router();
const FeedController = require('../controllers/feedController');
const { authenticate } = require('../middleware/authenticate');
const {
  postCreateValidation,
  commentCreateValidation,
  engagementValidation,
  viewTrackValidation,
  reportPostValidation
} = require('../validators/feedValidators');

const { antiCheatGuard } = require('../middleware/antiCheat');

// All feed routes require authentication
router.use(authenticate);

// ── Notifications ──
router.get('/notifications', FeedController.getNotifications);
router.get('/notifications/unread-count', FeedController.getUnreadNotificationCount);
router.post('/notifications/read', FeedController.markNotificationsAsRead);

// ── Feed Views ──
// Matches specific tab names for the home feed
router.get('/:tab(for-you|following|branch|trending|projects|internships|events)', FeedController.getFeedTab);

// ── Feed Interactions ──
router.post('/posts', postCreateValidation, FeedController.createPost);
router.get('/posts/:postId/comments', FeedController.getComments);

router.post('/like', engagementValidation, antiCheatGuard('like'), FeedController.toggleLike);
router.post('/comment', commentCreateValidation, antiCheatGuard('comment'), FeedController.addComment);
router.post('/save', engagementValidation, antiCheatGuard('save'), FeedController.toggleSave);
router.post('/share', FeedController.registerShare); // platform option in body
router.post('/view', viewTrackValidation, FeedController.trackView);
router.post('/report', reportPostValidation, FeedController.reportPost);
router.post('/poll/vote', FeedController.votePoll);

// ── Social following ──
router.post('/follow/:targetUserId', FeedController.followUser);

// ── Suggestions & Dashboards ──
router.get('/recommendations', FeedController.getRecommendations);
router.get('/opportunities', FeedController.getOpportunities);
router.get('/creator-analytics', FeedController.getCreatorAnalytics);

module.exports = router;
