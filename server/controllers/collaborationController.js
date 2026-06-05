const { validationResult } = require('express-validator');
const CollaborationService = require('../services/collaborationService');
const { sendSuccess, sendError, sendValidationError } = require('../utils/responseUtils');

class CollaborationController {
  // Helper to emit socket events
  static emitRealtimeEvent(req, room, eventName, data) {
    const io = req.app.get('io');
    if (io) {
      io.to(room).emit(eventName, data);
    }
  }

  // --- Communities ---
  static async createCommunity(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendValidationError(res, errors.array());

      const community = await CollaborationService.createCommunity(req.user.id, req.body);
      return sendSuccess(res, {
        statusCode: 201,
        message: 'Community created successfully',
        data: community,
      });
    } catch (error) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
  }

  static async joinCommunity(req, res, next) {
    try {
      const { communityId } = req.params;
      const result = await CollaborationService.joinCommunity(req.user.id, communityId);

      // Track community joining and award points
      if (!result.alreadyMember) {
        try {
          const pointsService = require('../services/pointsService');
          const PulseAnalyticsService = require('../services/pulseAnalyticsService');
          await pointsService.awardPoints(req.user.id, 'community_participation', communityId);
          await PulseAnalyticsService.trackActivity(req.user.id, 'community_joined', { communityId });
        } catch (err) {
          console.error('Failed to integrate community join:', err.message);
        }
      }
      
      // Notify community room of new member
      CollaborationController.emitRealtimeEvent(req, `community_${communityId}`, 'member_joined', {
        userId: req.user.id,
        communityId,
      });

      return sendSuccess(res, {
        message: result.alreadyMember ? 'Already a member' : 'Joined community successfully',
        data: result.record,
      });
    } catch (error) {
      next(error);
    }
  }

  static async leaveCommunity(req, res, next) {
    try {
      const { communityId } = req.params;
      const left = await CollaborationService.leaveCommunity(req.user.id, communityId);
      
      if (left) {
        CollaborationController.emitRealtimeEvent(req, `community_${communityId}`, 'member_left', {
          userId: req.user.id,
          communityId,
        });
      }

      return sendSuccess(res, {
        message: left ? 'Left community successfully' : 'Not a member of this community',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getRecommendedCommunities(req, res, next) {
    try {
      const recommendations = await CollaborationService.getRecommendedCommunities(req.user.id);
      return sendSuccess(res, {
        message: 'Recommended communities retrieved successfully',
        data: recommendations,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createPost(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendValidationError(res, errors.array());

      const { communityId } = req.params;
      const { content, mediaUrls } = req.body;

      const post = await CollaborationService.createPostInCommunity(req.user.id, communityId, content, mediaUrls);

      // Real-time emission to community room
      CollaborationController.emitRealtimeEvent(req, `community_${communityId}`, 'community_post_created', post);

      return sendSuccess(res, {
        statusCode: 201,
        message: 'Community post created successfully',
        data: post,
      });
    } catch (error) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
  }

  static async getCommunityPosts(req, res, next) {
    try {
      const { communityId } = req.params;
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;

      const result = await CollaborationService.getCommunityPosts(communityId, page, limit);
      return sendSuccess(res, {
        message: 'Community posts retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // --- Events ---
  static async createEvent(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendValidationError(res, errors.array());

      const event = await CollaborationService.createEvent(req.user.id, req.body);

      // Notify community or global users of new event
      if (event.communityId) {
        CollaborationController.emitRealtimeEvent(req, `community_${event.communityId}`, 'event_created', event);
      } else {
        CollaborationController.emitRealtimeEvent(req, 'global', 'event_created', event);
      }

      return sendSuccess(res, {
        statusCode: 201,
        message: 'Event created successfully',
        data: event,
      });
    } catch (error) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
  }

  static async registerForEvent(req, res, next) {
    try {
      const { eventId } = req.params;
      const event = await CollaborationService.registerForEvent(req.user.id, eventId);

      // Notify organizer of new participant
      CollaborationController.emitRealtimeEvent(req, `user_${event.organizerId}`, 'event_registration', {
        eventId,
        userId: req.user.id,
      });

      return sendSuccess(res, {
        message: 'Registered for event successfully',
        data: event,
      });
    } catch (error) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
  }

  static async listEvents(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const filters = {
        communityId: req.query.communityId,
        type: req.query.type,
        status: req.query.status,
        organizerId: req.query.organizerId,
      };

      const result = await CollaborationService.getEvents(filters, page, limit);
      return sendSuccess(res, {
        message: 'Events retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async markAttendance(req, res, next) {
    try {
      const { eventId } = req.params;
      const { attendeeId, attended } = req.body;

      const event = await CollaborationService.markAttendance(req.user.id, eventId, attendeeId, attended);

      // Award points & track activity on attendance verification
      if (attended) {
        try {
          const pointsService = require('../services/pointsService');
          const PulseAnalyticsService = require('../services/pulseAnalyticsService');
          const actionType = event.type === 'hackathon' ? 'hackathon_participation' : 'event_participation';
          await pointsService.awardPoints(attendeeId, actionType, eventId);
          await PulseAnalyticsService.trackActivity(attendeeId, 'event_attended', { eventId });
        } catch (err) {
          console.error('Failed to integrate attendance marking:', err.message);
        }
      }

      return sendSuccess(res, {
        message: 'Attendance status updated successfully',
        data: event,
      });
    } catch (error) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
  }

  // --- Mentorship ---
  static async requestMentorship(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendValidationError(res, errors.array());

      const { mentorId, topic, goals, message } = req.body;
      const mentorship = await CollaborationService.requestMentorship(req.user.id, mentorId, topic, goals, message);

      // Live request notification to mentor
      CollaborationController.emitRealtimeEvent(req, `user_${mentorId}`, 'mentorship_request', mentorship);

      return sendSuccess(res, {
        statusCode: 201,
        message: 'Mentorship request sent successfully',
        data: mentorship,
      });
    } catch (error) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
  }

  static async respondToMentorship(req, res, next) {
    try {
      const { mentorshipId } = req.params;
      const { accept } = req.body;

      const mentorship = await CollaborationService.respondToMentorship(req.user.id, mentorshipId, accept);

      // Live response to mentee
      CollaborationController.emitRealtimeEvent(req, `user_${mentorship.menteeId}`, 'mentorship_response', mentorship);

      return sendSuccess(res, {
        message: `Mentorship request ${accept ? 'accepted' : 'rejected'} successfully`,
        data: mentorship,
      });
    } catch (error) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
  }

  static async scheduleSession(req, res, next) {
    try {
      const { mentorshipId } = req.params;
      const { title, scheduledAt, meetingLink } = req.body;

      const mentorship = await CollaborationService.createMentorshipSession(req.user.id, mentorshipId, title, scheduledAt, meetingLink);

      // Notify counterpart
      const targetUser = mentorship.mentorId._id.toString() === req.user.id ? mentorship.menteeId._id : mentorship.mentorId._id;
      CollaborationController.emitRealtimeEvent(req, `user_${targetUser}`, 'session_scheduled', mentorship);

      return sendSuccess(res, {
        statusCode: 201,
        message: 'Mentorship session scheduled successfully',
        data: mentorship,
      });
    } catch (error) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
  }

  static async completeSession(req, res, next) {
    try {
      const { mentorshipId, sessionId } = req.params;
      const mentorship = await CollaborationService.completeMentorshipSession(req.user.id, mentorshipId, sessionId);

      // Track activity on completed mentorship session
      try {
        const PulseAnalyticsService = require('../services/pulseAnalyticsService');
        await PulseAnalyticsService.trackActivity(req.user.id, 'learning_completed', { mentorshipId, sessionId });
        const counterpart = mentorship.mentorId._id.toString() === req.user.id ? mentorship.menteeId._id : mentorship.mentorId._id;
        await PulseAnalyticsService.trackActivity(counterpart, 'learning_completed', { mentorshipId, sessionId });
      } catch (err) {
        console.error('Failed to track mentorship session completion:', err.message);
      }

      CollaborationController.emitRealtimeEvent(req, `user_${mentorship.menteeId._id}`, 'session_completed', mentorship);

      return sendSuccess(res, {
        message: 'Session marked as completed successfully',
        data: mentorship,
      });
    } catch (error) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
  }

  static async submitMentorshipFeedback(req, res, next) {
    try {
      const { mentorshipId } = req.params;
      const { rating, comment } = req.body;

      const mentorship = await CollaborationService.submitMentorshipFeedback(req.user.id, mentorshipId, rating, comment);

      CollaborationController.emitRealtimeEvent(req, `user_${mentorship.mentorId._id}`, 'mentorship_feedback_submitted', mentorship);

      return sendSuccess(res, {
        message: 'Feedback submitted and mentorship completed successfully',
        data: mentorship,
      });
    } catch (error) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
  }

  static async getMentorships(req, res, next) {
    try {
      const role = req.query.role || 'mentee';
      const status = req.query.status || null;

      const list = await CollaborationService.getMentorshipsForUser(req.user.id, role, status);
      return sendSuccess(res, {
        message: 'Mentorships retrieved successfully',
        data: list,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMentorSuggestions(req, res, next) {
    try {
      const suggestions = await CollaborationService.getMentorSuggestions(req.user.id);
      return sendSuccess(res, {
        message: 'Peer mentor suggestions retrieved successfully',
        data: suggestions,
      });
    } catch (error) {
      next(error);
    }
  }

  // --- Project Teams & Matching ---
  static async createTeam(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendValidationError(res, errors.array());

      const team = await CollaborationService.createProjectTeam(req.user.id, req.body);
      return sendSuccess(res, {
        statusCode: 201,
        message: 'Collaboration project team created successfully',
        data: team,
      });
    } catch (error) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
  }

  static async getTeamMatches(req, res, next) {
    try {
      const type = req.query.type || 'team'; // team or peer
      let matches;
      if (type === 'peer') {
        matches = await CollaborationService.getTeammateSuggestions(req.user.id);
      } else {
        matches = await CollaborationService.getTeamSuggestions(req.user.id);
      }

      return sendSuccess(res, {
        message: 'AI compatibility matches retrieved successfully',
        data: matches,
      });
    } catch (error) {
      next(error);
    }
  }

  static async inviteOrRequestTeam(req, res, next) {
    try {
      const { teamId } = req.params;
      const { targetUserId, role, isInvitation } = req.body;

      const team = await CollaborationService.joinOrInviteTeamMember(
        req.user.id,
        teamId,
        targetUserId,
        role,
        isInvitation
      );

      // Emit notifications
      if (isInvitation) {
        CollaborationController.emitRealtimeEvent(req, `user_${targetUserId}`, 'team_invitation', {
          teamId,
          role,
        });
      } else {
        CollaborationController.emitRealtimeEvent(req, `user_${team.creatorId}`, 'team_join_request', {
          teamId,
          userId: req.user.id,
          role,
        });
      }

      return sendSuccess(res, {
        message: isInvitation ? 'Invitation sent successfully' : 'Request to join submitted successfully',
        data: team,
      });
    } catch (error) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
  }

  static async respondToTeamOffer(req, res, next) {
    try {
      const { teamId } = req.params;
      const { accept } = req.body;

      const team = await CollaborationService.respondToTeamOffer(req.user.id, teamId, accept);

      CollaborationController.emitRealtimeEvent(req, `user_${team.creatorId}`, 'team_offer_response', {
        teamId,
        userId: req.user.id,
        accept,
      });

      return sendSuccess(res, {
        message: `Team invitation ${accept ? 'accepted' : 'declined'} successfully`,
        data: team,
      });
    } catch (error) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
  }

  static async approveJoinRequest(req, res, next) {
    try {
      const { teamId } = req.params;
      const { candidateId, approve } = req.body;

      const team = await CollaborationService.approveTeamJoinRequest(req.user.id, teamId, candidateId, approve);

      // Track activity on team collaboration
      if (approve) {
        try {
          const PulseAnalyticsService = require('../services/pulseAnalyticsService');
          await PulseAnalyticsService.trackActivity(candidateId, 'team_collaboration', { teamId });
          await PulseAnalyticsService.trackActivity(req.user.id, 'team_collaboration', { teamId });
        } catch (err) {
          console.error('Failed to track team collaboration activity:', err.message);
        }
      }

      CollaborationController.emitRealtimeEvent(req, `user_${candidateId}`, 'team_join_approval', {
        teamId,
        approve,
      });

      return sendSuccess(res, {
        message: `Candidate application ${approve ? 'approved' : 'declined'} successfully`,
        data: team,
      });
    } catch (error) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
  }
}

module.exports = CollaborationController;
