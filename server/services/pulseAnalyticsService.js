const ActivityRepository = require('../repositories/activityRepository');
const GrowthRepository = require('../repositories/growthRepository');
const CareerRepository = require('../repositories/careerRepository');
const AnalyticsRepository = require('../repositories/analyticsRepository');
const GrowthCalculator = require('./growthCalculator');
const CareerInsightsEngine = require('./careerInsightsEngine');
const InternshipMatcher = require('./internshipMatcher');
const ReminderEngine = require('./reminderEngine');
const EngagementEngine = require('./engagementEngine');
const { getIO } = require('./socketService');
const User = require('../models/User');
const Profile = require('../models/Profile');

class PulseAnalyticsService {
  // Map actions to timeline counter fields and weights
  static getActionSpecs() {
    return {
      post_created: { field: 'postsCreated', weight: 10 },
      project_uploaded: { field: 'projectsUploaded', weight: 35 },
      community_joined: { field: 'communitiesJoined', weight: 5 },
      resource_shared: { field: 'resourcesShared', weight: 15 },
      event_attended: { field: 'eventsAttended', weight: 20 },
      team_collaboration: { field: 'teamCollaborations', weight: 25 },
      learning_completed: { field: 'learningActivity', weight: 15 },
    };
  }

  /**
   * Tracks user activity, updates daily timeline aggregates, and recalculates growth metrics.
   */
  static async trackActivity(userId, action, details = {}) {
    // 1. Log action stream
    const activityLog = await ActivityRepository.logAction(userId, action, details);

    // 2. Map actions to counters and weights
    const spec = PulseAnalyticsService.getActionSpecs()[action];
    if (spec) {
      await ActivityRepository.upsertDailyTimeline(userId, new Date(), spec.field, spec.weight);
    }

    // 3. Recalculate Growth Metrics
    const userProfile = await Profile.findOne({ userId }).lean();
    if (userProfile) {
      // Gather activity timeline aggregate counts
      const aggregates = await ActivityRepository.getActivityAggregates(userId);
      const activityCounts = {};
      aggregates.forEach(agg => {
        const fieldName = (PulseAnalyticsService.getActionSpecs()[agg._id] || {}).field;
        if (fieldName) {
          activityCounts[fieldName] = agg.count;
        }
      });

      const scores = GrowthCalculator.calculateScores(userProfile, activityCounts);
      const metrics = await GrowthRepository.updateGrowthMetrics(userId, scores);

      // Real-time socket broadcast for updated scores
      try {
        const io = getIO();
        if (io) {
          io.to(`user:${userId}`).emit('growth_metrics_updated', metrics);
        }
      } catch (wsErr) {
        console.warn('Socket growth broadcast failed:', wsErr.message);
      }
    }

    return activityLog;
  }

  /**
   * Evaluates skill gaps and dynamically pairs users with career tracks and job vacancies.
   */
  static async generateCareerPathInsights(userId) {
    const user = await User.findById(userId).lean();
    if (!user) throw new Error('User not found');

    const userProfile = await Profile.findOne({ userId }).lean();
    if (!userProfile) throw new Error('User profile not found');

    // 1. Career Gap and Roadmap Analysis
    const analysis = CareerInsightsEngine.analyzeProfile(user, userProfile);
    
    // Save insights and roadmaps
    await CareerRepository.upsertInsights(userId, analysis.insights);
    await CareerRepository.saveCareerRecommendations(userId, analysis.recommendations);

    // 2. Internship Matching
    const matches = InternshipMatcher.matchOpportunities(userId, user, userProfile);
    await CareerRepository.saveInternshipRecommendations(userId, matches);

    // Socket broadcast
    try {
      const io = getIO();
      if (io) {
        io.to(`user:${userId}`).emit('career_insights_updated', {
          insights: analysis.insights,
          recommendations: analysis.recommendations,
          internshipsCount: matches.length,
        });
      }
    } catch (wsErr) {
      console.warn('Socket career insights broadcast failed:', wsErr.message);
    }

    return {
      insights: analysis.insights,
      recommendations: analysis.recommendations,
      internships: matches,
    };
  }

  /**
   * Schedules reminders for deadlines or incomplete profiles.
   */
  static async scheduleReminders(userId) {
    const userProfile = await Profile.findOne({ userId }).lean();
    if (!userProfile) throw new Error('Profile not found');

    const reminders = await ReminderEngine.evaluateReminders(userId, userProfile);
    const scheduledDocs = [];

    for (const rem of reminders) {
      const doc = await AnalyticsRepository.createReminderSchedule(
        userId,
        rem.title,
        rem.type,
        rem.scheduledAt,
        rem.triggerDetails
      );
      scheduledDocs.push(doc);
    }

    return scheduledDocs;
  }

  /**
   * Tracks session login durations and computes churn status.
   */
  static async logSession(userId, durationMs = 0) {
    const engagement = await AnalyticsRepository.updateEngagementMetric(userId, durationMs);
    
    const churnAnalysis = EngagementEngine.assessChurnRisk(engagement.lastActiveAt);
    await AnalyticsRepository.updateEngagementStatus(userId, churnAnalysis.churnRisk, churnAnalysis.status);

    return engagement;
  }

  /**
   * Collates overall metrics for unified dashboard display.
   */
  static async getConsolidatedDashboard(userId) {
    const [profile, timeline, growth, insights, recommendations, internships, reminders, engagement] = await Promise.all([
      Profile.findOne({ userId }).select('profileCompletionScore skills interests').lean(),
      ActivityRepository.getTimeline(userId, new Date(Date.now() - 30 * 86400000), new Date()), // last 30 days
      GrowthRepository.getGrowthMetrics(userId),
      CareerRepository.getInsights(userId),
      CareerRepository.getCareerRecommendations(userId),
      CareerRepository.getInternshipRecommendations(userId, { status: 'active' }),
      AnalyticsRepository.getReminderSchedules(userId, 'pending'),
      AnalyticsRepository.getEngagementMetric(userId),
    ]);

    // Save consolidated user analytics profile
    const totalActivityCount = timeline.reduce((sum, row) => sum + (row.totalScore || 0), 0);
    const completion = profile ? profile.profileCompletionScore : 0;

    const data = {
      profileCompletionScore: completion,
      totalPostsCreated: timeline.reduce((sum, row) => sum + row.counts.postsCreated, 0),
      totalProjectsUploaded: timeline.reduce((sum, row) => sum + row.counts.projectsUploaded, 0),
      totalResourcesShared: timeline.reduce((sum, row) => sum + row.counts.resourcesShared, 0),
      totalEventsAttended: timeline.reduce((sum, row) => sum + row.counts.eventsAttended, 0),
      learningProgressScore: growth ? growth.skillGrowthScore : 0,
      overallActivityScore: totalActivityCount,
    };

    const analyticsProfile = await AnalyticsRepository.updateUserAnalytics(userId, data);

    return {
      analyticsProfile,
      growth,
      insights,
      recommendations,
      internships,
      reminders,
      engagement,
      timeline,
    };
  }
}

module.exports = PulseAnalyticsService;
