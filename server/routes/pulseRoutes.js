const express = require('express');
const router = express.Router();
const PulseController = require('../controllers/pulseController');
const { authenticate } = require('../middleware/authenticate');
const {
  updatePreferencesValidation,
  trackActivityValidation,
  logSessionValidation,
  updateInternshipStatusValidation,
} = require('../validators/pulseValidator');

// All PulseNotify routes require authentication
router.use(authenticate);

// Inbox notifications
router.get('/notifications', PulseController.getNotifications);
router.post('/notifications/:notificationId/read', PulseController.markNotificationRead);
router.post('/notifications/read-all', PulseController.markAllNotificationsRead);

// Preferences
router.get('/preferences', PulseController.getPreferences);
router.put('/preferences', updatePreferencesValidation, PulseController.updatePreferences);

// Activity Tracker & timeline logs
router.post('/activity', trackActivityValidation, PulseController.trackActivity);
router.get('/timeline', PulseController.getTimeline);

// Career insights roadmap & Matching internships
router.post('/career/insights', PulseController.getCareerInsights);
router.get('/career/opportunities', PulseController.getInternshipRecommendations);
router.put('/career/opportunities/:recommendationId', updateInternshipStatusValidation, PulseController.updateInternshipStatus);

// Deadlines & Profile completion reminders
router.get('/reminders', PulseController.getReminders);
router.post('/reminders/trigger', PulseController.triggerReminderEvaluation);

// Active session duration tracker
router.post('/session', logSessionValidation, PulseController.logSession);

// Main Student analytics dashboard
router.get('/dashboard', PulseController.getDashboard);

module.exports = router;
