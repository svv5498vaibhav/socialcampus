const express = require('express');
const router = express.Router();
const CollaborationController = require('../controllers/collaborationController');
const { authenticate } = require('../middleware/authenticate');
const {
  createCommunityValidation,
  createPostValidation,
  createEventValidation,
  requestMentorshipValidation,
  createTeamValidation,
} = require('../validators/collaborationValidator');

// All collaboration routes require authentication
router.use(authenticate);

// Communities
router.post('/communities', createCommunityValidation, CollaborationController.createCommunity);
router.post('/communities/:communityId/join', CollaborationController.joinCommunity);
router.post('/communities/:communityId/leave', CollaborationController.leaveCommunity);
router.get('/communities/recommended', CollaborationController.getRecommendedCommunities);
router.post('/communities/:communityId/posts', createPostValidation, CollaborationController.createPost);
router.get('/communities/:communityId/posts', CollaborationController.getCommunityPosts);

// Events
router.post('/events', createEventValidation, CollaborationController.createEvent);
router.post('/events/:eventId/register', CollaborationController.registerForEvent);
router.get('/events', CollaborationController.listEvents);
router.post('/events/:eventId/attendance', CollaborationController.markAttendance);

// Mentorship
router.post('/mentorship/request', requestMentorshipValidation, CollaborationController.requestMentorship);
router.post('/mentorship/:mentorshipId/respond', CollaborationController.respondToMentorship);
router.post('/mentorship/:mentorshipId/sessions', CollaborationController.scheduleSession);
router.post('/mentorship/:mentorshipId/sessions/:sessionId/complete', CollaborationController.completeSession);
router.post('/mentorship/:mentorshipId/feedback', CollaborationController.submitMentorshipFeedback);
router.get('/mentorship', CollaborationController.getMentorships);
router.get('/mentorship/suggested-mentors', CollaborationController.getMentorSuggestions);

// Project Teams
router.post('/teams', createTeamValidation, CollaborationController.createTeam);
router.get('/teams/matches', CollaborationController.getTeamMatches);
router.post('/teams/:teamId/member', CollaborationController.inviteOrRequestTeam);
router.post('/teams/:teamId/respond', CollaborationController.respondToTeamOffer);
router.post('/teams/:teamId/approve', CollaborationController.approveJoinRequest);

module.exports = router;
