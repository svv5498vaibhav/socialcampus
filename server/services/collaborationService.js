const CommunityRepository = require('../repositories/communityRepository');
const MentorshipRepository = require('../repositories/mentorshipRepository');
const ProjectRepository = require('../repositories/projectRepository');
const CommunityRecEngine = require('./communityRecEngine');
const TeamMatchingEngine = require('./teamMatchingEngine');
const MentorshipEngine = require('./mentorshipEngine');
const User = require('../models/User');

class CollaborationService {
  // --- Community Operations ---
  static async createCommunity(userId, data) {
    const community = await CommunityRepository.createCommunity({ ...data, createdBy: userId });
    // Creator automatically joins as admin
    await CommunityRepository.addMember(community._id, userId, 'admin');
    return community;
  }

  static async joinCommunity(userId, communityId) {
    return await CommunityRepository.addMember(communityId, userId, 'member');
  }

  static async leaveCommunity(userId, communityId) {
    return await CommunityRepository.removeMember(communityId, userId);
  }

  static async getRecommendedCommunities(userId) {
    const user = await User.findById(userId).lean();
    if (!user) throw new Error('User not found');

    const recommendations = await CommunityRecEngine.generateRecommendations(userId, user);
    await CommunityRepository.saveRecommendations(userId, recommendations);

    return await CommunityRepository.getRecommendations(userId);
  }

  static async createPostInCommunity(userId, communityId, content, mediaUrls = []) {
    // Check if member
    const role = await CommunityRepository.getRole(communityId, userId);
    if (!role) throw new Error('You must be a member of the community to post');

    return await CommunityRepository.createPost(communityId, userId, content, mediaUrls);
  }

  static async getCommunityPosts(communityId, page = 1, limit = 20) {
    return await CommunityRepository.listPosts(communityId, page, limit);
  }

  // --- Events ---
  static async createEvent(userId, data) {
    // If communityId is provided, check if user is admin/moderator of the community
    if (data.communityId) {
      const role = await CommunityRepository.getRole(data.communityId, userId);
      if (role !== 'admin' && role !== 'moderator') {
        throw new Error('Only admins or moderators can create events in this community');
      }
    }
    return await CommunityRepository.createEvent({ ...data, organizerId: userId });
  }

  static async registerForEvent(userId, eventId) {
    return await CommunityRepository.registerForEvent(eventId, userId);
  }

  static async getEvents(filters = {}, page = 1, limit = 20) {
    return await CommunityRepository.listEvents(filters, page, limit);
  }

  static async markAttendance(userId, eventId, attendeeId, attended = true) {
    const event = await CommunityRepository.findEventById(eventId);
    if (!event) throw new Error('Event not found');

    // Only organizer can mark attendance
    if (event.organizerId.toString() !== userId.toString()) {
      throw new Error('Only the event organizer can mark attendance');
    }

    return await CommunityRepository.trackEventAttendance(eventId, attendeeId, attended);
  }

  // --- Mentorship ---
  static async requestMentorship(menteeId, mentorId, topic, goals, message) {
    return await MentorshipRepository.requestMentorship({
      mentorId,
      menteeId,
      topic,
      goals,
      message,
      status: 'pending',
    });
  }

  static async respondToMentorship(userId, mentorshipId, accept = true) {
    const mentorship = await MentorshipRepository.findById(mentorshipId);
    if (!mentorship) throw new Error('Mentorship not found');

    // Only mentor can respond
    if (mentorship.mentorId._id.toString() !== userId.toString()) {
      throw new Error('Only the mentor can respond to this request');
    }

    const status = accept ? 'accepted' : 'rejected';
    return await MentorshipRepository.updateStatus(mentorshipId, status);
  }

  static async createMentorshipSession(userId, mentorshipId, title, scheduledAt, meetingLink = '') {
    const mentorship = await MentorshipRepository.findById(mentorshipId);
    if (!mentorship) throw new Error('Mentorship not found');

    if (mentorship.status !== 'accepted') {
      throw new Error('Mentorship request is not active');
    }

    // Only mentor or mentee can add sessions
    if (
      mentorship.mentorId._id.toString() !== userId.toString() &&
      mentorship.menteeId._id.toString() !== userId.toString()
    ) {
      throw new Error('Unauthorized');
    }

    return await MentorshipRepository.addSession(mentorshipId, { title, scheduledAt, meetingLink });
  }

  static async completeMentorshipSession(userId, mentorshipId, sessionId) {
    const mentorship = await MentorshipRepository.findById(mentorshipId);
    if (!mentorship) throw new Error('Mentorship not found');

    // Only mentor can complete
    if (mentorship.mentorId._id.toString() !== userId.toString()) {
      throw new Error('Only the mentor can mark a session as completed');
    }

    return await MentorshipRepository.updateSessionCompletion(mentorshipId, sessionId, true);
  }

  static async submitMentorshipFeedback(userId, mentorshipId, rating, comment = '') {
    const mentorship = await MentorshipRepository.findById(mentorshipId);
    if (!mentorship) throw new Error('Mentorship not found');

    // Only mentee can give feedback
    if (mentorship.menteeId._id.toString() !== userId.toString()) {
      throw new Error('Only the mentee can submit feedback');
    }

    await MentorshipRepository.submitFeedback(mentorshipId, rating, comment);
    return await MentorshipRepository.updateStatus(mentorshipId, 'completed');
  }

  static async getMentorshipsForUser(userId, role = 'mentee', status = null) {
    const filters = {};
    if (role === 'mentor') filters.mentorId = userId;
    else filters.menteeId = userId;
    if (status) filters.status = status;

    return await MentorshipRepository.listMentorships(filters);
  }

  static async getMentorSuggestions(userId) {
    return await MentorshipEngine.suggestMentors(userId);
  }

  // --- Teams & Teammates ---
  static async createProjectTeam(creatorId, data) {
    const team = await ProjectRepository.createTeam({
      ...data,
      creatorId,
      members: [{ userId: creatorId, role: 'Creator/Lead', status: 'joined', joinedAt: new Date() }],
      status: 'recruiting',
    });
    return team;
  }

  static async getTeammateSuggestions(userId) {
    const suggestions = await TeamMatchingEngine.suggestPeersForUser(userId);
    await ProjectRepository.saveTeamMatches(userId, suggestions);
    return await ProjectRepository.getTeamMatches(userId);
  }

  static async getTeamSuggestions(userId) {
    const suggestions = await TeamMatchingEngine.suggestTeamsForUser(userId);
    await ProjectRepository.saveTeamMatches(userId, suggestions);
    return await ProjectRepository.getTeamMatches(userId);
  }
  static async joinOrInviteTeamMember(userId, teamId, targetUserId, role, isInvitation = true) {
    const team = await ProjectRepository.findTeamById(teamId);
    if (!team) throw new Error('Team not found');

    if (isInvitation) {
      // Only team creator can invite
      const creatorId = team.creatorId._id ? team.creatorId._id.toString() : team.creatorId.toString();
      if (creatorId !== userId.toString()) {
        throw new Error('Only the team creator can invite members');
      }
      return await ProjectRepository.inviteOrRequestMember(teamId, targetUserId, role, 'pending');
    } else {
      // Student is requesting to join
      return await ProjectRepository.inviteOrRequestMember(teamId, userId, role, 'pending');
    }
  }

  static async respondToTeamOffer(userId, teamId, accept = true) {
    const team = await ProjectRepository.findTeamById(teamId);
    if (!team) throw new Error('Team not found');

    const member = team.members.find(m => {
      const mId = m.userId._id ? m.userId._id.toString() : m.userId.toString();
      return mId === userId.toString();
    });
    if (!member) throw new Error('No pending invitation or request found for this user');

    const status = accept ? 'joined' : 'declined';
    return await ProjectRepository.updateMemberStatus(teamId, userId, status);
  }

  static async approveTeamJoinRequest(userId, teamId, candidateId, approve = true) {
    const team = await ProjectRepository.findTeamById(teamId);
    if (!team) throw new Error('Team not found');

    // Only team lead can approve requests
    const creatorId = team.creatorId._id ? team.creatorId._id.toString() : team.creatorId.toString();
    if (creatorId !== userId.toString()) {
      throw new Error('Only the team lead can approve join requests');
    }

    const status = approve ? 'joined' : 'declined';
    return await ProjectRepository.updateMemberStatus(teamId, candidateId, status);
  }
}

module.exports = CollaborationService;
