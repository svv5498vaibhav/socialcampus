import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach access token & fix FormData content-type
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('campusx_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Separate axios instance for refresh calls — bypasses interceptors to prevent infinite loops
const refreshClient = axios.create({
  baseURL: '/api',
  timeout: 15000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor — handle 401 and auto-refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip refresh logic for the refresh endpoint itself to prevent infinite loops
    const isRefreshRequest = originalRequest.url?.includes('/auth/refresh-token');
    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshRequest) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Use refreshClient (no interceptors) to avoid re-entrant 401 handling
        const { data } = await refreshClient.post('/auth/refresh-token');
        const newToken = data.data.accessToken;
        localStorage.setItem('campusx_access_token', newToken);
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('campusx_access_token');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// API methods
export const guardianApi = {
  // Auth
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  resendOTP: (data) => api.post('/auth/resend-otp', data),
  refreshToken: () => api.post('/auth/refresh-token'),
  logout: () => api.post('/auth/logout'),
  logoutAll: () => api.post('/auth/logout-all'),

  // Recovery
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),

  // Profile
  getProfile: () => api.get('/profile'),
  uploadAvatar: (formData) => api.post('/profile/avatar', formData, {
    timeout: 30000,
  }),
  deleteAvatar: () => api.delete('/profile/avatar'),

  // Security
  getSecurityStatus: () => api.get('/security/status'),
  getLoginHistory: (page = 1) => api.get(`/security/login-history?page=${page}`),
  getTrustScore: () => api.get('/security/trust-score'),
  getSessions: () => api.get('/security/sessions'),
  revokeSession: (id) => api.delete(`/security/sessions/${id}`),

  // Admin
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserDetail: (id) => api.get(`/admin/users/${id}`),
  blockUser: (id) => api.patch(`/admin/users/${id}/block`),
  suspendUser: (id) => api.patch(`/admin/users/${id}/suspend`),
  getFraudAlerts: (params) => api.get('/admin/fraud-alerts', { params }),
  getSecurityLogs: (params) => api.get('/admin/security-logs', { params }),
  getAdminStats: () => api.get('/admin/stats'),

  // ═══════════════════════════════════════
  // ProfilePilot AI
  // ═══════════════════════════════════════

  // Onboarding
  getOnboardingStatus: () => api.get('/onboarding/status'),
  saveOnboardingStep: (step, data) => api.post(`/onboarding/step/${step}`, data),
  completeOnboarding: () => api.post('/onboarding/complete'),
  getInterestSuggestions: () => api.get('/onboarding/suggestions/interests'),
  getSkillSuggestions: () => api.get('/onboarding/suggestions/skills'),

  // Profile (ProfilePilot)
  getFullProfile: () => api.get('/profile/me'),
  updateFullProfile: (data) => api.put('/profile/me', data),
  getProfileCompletion: () => api.get('/profile/completion'),
  getCareerRecommendations: () => api.get('/profile/recommendations'),
  generateBio: () => api.post('/profile/generate-bio'),
  getRecommendedSkills: () => api.get('/profile/recommended-skills'),
  getRecommendedInterests: () => api.get('/profile/recommended-interests'),
  getCareerRoadmap: (goal) => api.get(`/profile/career-roadmap${goal ? `?goal=${encodeURIComponent(goal)}` : ''}`),

  // Admin Analytics (ProfilePilot)
  getProfileAnalytics: () => api.get('/admin/profile-analytics'),
  getSkillTrends: () => api.get('/admin/skill-trends'),
  getInterestTrends: () => api.get('/admin/interest-trends'),

  // ═══════════════════════════════════════
  // FeedSense AI
  // ═══════════════════════════════════════
  getFeed: (tab, page = 1, limit = 10) => api.get(`/feed/${tab}?page=${page}&limit=${limit}`),
  createPost: (data) => api.post('/feed/posts', data),
  getComments: (postId, page = 1) => api.get(`/feed/posts/${postId}/comments?page=${page}`),
  toggleLike: (postId) => api.post('/feed/like', { postId }),
  addComment: (postId, content) => api.post('/feed/comment', { postId, content }),
  toggleSave: (postId) => api.post('/feed/save', { postId }),
  sharePost: (postId, platform) => api.post('/feed/share', { postId, platform }),
  trackView: (postId, watchTime) => api.post('/feed/view', { postId, watchTime }),
  reportPost: (postId, reason) => api.post('/feed/report', { postId, reason }),
  followUser: (targetUserId) => api.post(`/feed/follow/${targetUserId}`),
  votePoll: (postId, optionIndex) => api.post('/feed/poll/vote', { postId, optionIndex }),
  getFeedRecommendations: () => api.get('/feed/recommendations'),
  getOpportunities: () => api.get('/feed/opportunities'),
  getCreatorAnalytics: () => api.get('/feed/creator-analytics'),

  // Feed Admin
  getReportedPosts: (page = 1) => api.get(`/admin/feed/reports?page=${page}`),
  deletePost: (postId) => api.delete(`/admin/feed/posts/${postId}`),
  dismissReport: (postId) => api.post(`/admin/feed/posts/${postId}/dismiss`),
  getSpamAlerts: (page = 1) => api.get(`/admin/feed/spam?page=${page}`),
  getFeedPerformance: () => api.get('/admin/feed/performance'),

  // ── RankForge AI (Gamification) ──
  getOverallLeaderboard: (page = 1, limit = 50) => api.get(`/gamification/leaderboard?page=${page}&limit=${limit}`),
  getBranchLeaderboard: (branch, page = 1, limit = 50) => api.get(`/gamification/leaderboard/branch?branch=${encodeURIComponent(branch || '')}&page=${page}&limit=${limit}`),
  getCollegeLeaderboard: (college, page = 1, limit = 50) => api.get(`/gamification/leaderboard/college?college=${encodeURIComponent(college || '')}&page=${page}&limit=${limit}`),
  getWeeklyLeaderboard: (page = 1, limit = 50) => api.get(`/gamification/leaderboard/weekly?page=${page}&limit=${limit}`),
  getMonthlyLeaderboard: (page = 1, limit = 50) => api.get(`/gamification/leaderboard/monthly?page=${page}&limit=${limit}`),
  getAchievements: () => api.get('/gamification/achievements'),
  getBadges: () => api.get('/gamification/badges'),
  getReputation: () => api.get('/gamification/reputation'),
  getRankingHistory: (days = 30) => api.get(`/gamification/ranking/history?days=${days}`),
  markCommentHelpful: (commentId) => api.post(`/gamification/comments/${commentId}/helpful`),
  updatePoints: (userId, points, reason) => api.post('/gamification/points/update', { userId, points, reason }),
  getRewards: () => api.get('/gamification/rewards'),
  redeemReward: (rewardId) => api.post('/gamification/rewards/redeem', { rewardId }),
  getRewardHistory: (page = 1, limit = 20) => api.get(`/gamification/rewards/history?page=${page}&limit=${limit}`),
  fulfillReward: (transactionId, notes) => api.post('/gamification/rewards/admin/fulfill', { transactionId, notes }),
  refundReward: (transactionId, reason) => api.post('/gamification/rewards/admin/refund', { transactionId, reason }),

  // ── SafeVoice AI (Anonymous Feedback) ──
  createAnonymousPost: (content, type) => api.post('/anonymous/post', { content, type }),
  getAnonymousFeed: (params) => api.get('/anonymous/feed', { params }),
  reportAnonymousPost: (postId, reason, details) => api.post('/anonymous/report', { postId, reason, details }),
  getTrendingAnonymous: () => api.get('/anonymous/trending'),
  getAnonymousCategories: () => api.get('/anonymous/categories'),
  getAnonymousSentiment: () => api.get('/anonymous/sentiment'),
  getCommunityHealth: () => api.get('/anonymous/community-health'),
  getAnonymousAnalytics: () => api.get('/anonymous/analytics'),
  adminModeratePost: (postId, status, reason) => api.post('/anonymous/admin/moderate', { postId, status, reason }),
  adminGetReports: (page = 1) => api.get(`/anonymous/admin/reports?page=${page}`),
  adminGetEscalations: (page = 1) => api.get(`/anonymous/admin/escalations?page=${page}`),
  adminResolveEscalation: (escalationId, notes) => api.post('/anonymous/admin/escalations/resolve', { escalationId, notes }),

  // ── BranchConnect AI (Collaboration) ──
  createCommunity: (data) => api.post('/collaboration/communities', data),
  joinCommunity: (communityId) => api.post(`/collaboration/communities/${communityId}/join`),
  leaveCommunity: (communityId) => api.post(`/collaboration/communities/${communityId}/leave`),
  getRecommendedCommunities: () => api.get('/collaboration/communities/recommended'),
  createCommunityPost: (communityId, content, mediaUrls) => api.post(`/collaboration/communities/${communityId}/posts`, { content, mediaUrls }),
  getCommunityPosts: (communityId, page = 1) => api.get(`/collaboration/communities/${communityId}/posts?page=${page}`),
  createEvent: (data) => api.post('/collaboration/events', data),
  registerForEvent: (eventId) => api.post(`/collaboration/events/${eventId}/register`),
  listEvents: (params) => api.get('/collaboration/events', { params }),
  markEventAttendance: (eventId, attendeeId, attended) => api.post(`/collaboration/events/${eventId}/attendance`, { attendeeId, attended }),
  requestMentorship: (data) => api.post('/collaboration/mentorship/request', data),
  respondToMentorship: (mentorshipId, accept) => api.post(`/collaboration/mentorship/${mentorshipId}/respond`, { accept }),
  scheduleMentorshipSession: (mentorshipId, title, scheduledAt, meetingLink) => api.post(`/collaboration/mentorship/${mentorshipId}/sessions`, { title, scheduledAt, meetingLink }),
  completeMentorshipSession: (mentorshipId, sessionId) => api.post(`/collaboration/mentorship/${mentorshipId}/sessions/${sessionId}/complete`),
  submitMentorshipFeedback: (mentorshipId, rating, comment) => api.post(`/collaboration/mentorship/${mentorshipId}/feedback`, { rating, comment }),
  getMentorships: (role, status) => api.get(`/collaboration/mentorship?role=${role}${status ? `&status=${status}` : ''}`),
  getSuggestedMentors: () => api.get('/collaboration/mentorship/suggested-mentors'),
  createTeam: (data) => api.post('/collaboration/teams', data),
  getTeamMatches: (type = 'team') => api.get(`/collaboration/teams/matches?type=${type}`),
  inviteOrRequestTeam: (teamId, targetUserId, role, isInvitation) => api.post(`/collaboration/teams/${teamId}/member`, { targetUserId, role, isInvitation }),
  respondToTeamOffer: (teamId, accept) => api.post(`/collaboration/teams/${teamId}/respond`, { accept }),
  approveTeamJoinRequest: (teamId, candidateId, approve) => api.post(`/collaboration/teams/${teamId}/approve`, { candidateId, approve }),

  // ── CreatorBoost AI (Creator Features) ──
  publishProject: (data) => api.post('/creator/projects', data),
  getProjectDetails: (projectId) => api.get(`/creator/projects/${projectId}`),
  listProjects: (params) => api.get('/creator/projects', { params }),
  publishContentPost: (data) => api.post('/creator/posts', data),
  getContentPost: (postId) => api.get(`/creator/posts/${postId}`),
  listContentPosts: (params) => api.get('/creator/posts', { params }),
  likeCreatorPost: (postId) => api.post(`/creator/posts/${postId}/like`),
  getWritingSuggestions: (title, content, type) => api.post('/creator/helper/suggestions', { title, content, type }),
  uploadResource: (data) => api.post('/creator/resources', data),
  downloadResource: (resourceId) => api.get(`/creator/resources/${resourceId}/download`),
  listResources: (params) => api.get('/creator/resources', { params }),
  trackEngagement: (data) => api.post('/creator/analytics/track', data),
  getCreatorDashboardStats: () => api.get('/creator/analytics/dashboard'),
  getPostAnalyticsDetails: (postId) => api.get(`/creator/analytics/post/${postId}`),

  // ── PulseNotify AI (Pulse AI) ──
  getPulseNotifications: () => api.get('/pulse/notifications'),
  markPulseNotificationRead: (id) => api.post(`/pulse/notifications/${id}/read`),
  markAllPulseNotificationsRead: () => api.post('/pulse/notifications/read-all'),
  getPulsePreferences: () => api.get('/pulse/preferences'),
  updatePulsePreferences: (data) => api.put('/pulse/preferences', data),
  trackPulseActivity: (action, details) => api.post('/pulse/activity', { action, details }),
  getPulseTimeline: () => api.get('/pulse/timeline'),
  triggerCareerInsights: () => api.post('/pulse/career/insights'),
  getInternshipOpportunities: () => api.get('/pulse/career/opportunities'),
  updateOpportunityStatus: (recommendationId, status) => api.put(`/pulse/career/opportunities/${recommendationId}`, { status }),
  getReminders: () => api.get('/pulse/reminders'),
  triggerReminderEvaluation: () => api.post('/pulse/reminders/trigger'),
  logPulseSession: (durationMs) => api.post('/pulse/session', { durationMs }),
  getPulseDashboard: () => api.get('/pulse/dashboard'),
};

export default api;
