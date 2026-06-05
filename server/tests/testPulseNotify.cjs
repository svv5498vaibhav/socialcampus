/**
 * Integration Test Suite for:
 * PulseNotify AI Module
 *
 * Run: node tests/testPulseNotify.cjs (from server directory)
 */

const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
const connectDatabase = require('../config/database');

// Models
const User = require('../models/User');
const Profile = require('../models/Profile');
const Notification = require('../models/Notification');
const NotificationPreference = require('../models/NotificationPreference');
const UserActivity = require('../models/UserActivity');
const ActivityTimeline = require('../models/ActivityTimeline');
const GrowthMetrics = require('../models/GrowthMetrics');
const CareerInsight = require('../models/CareerInsight');
const CareerRecommendation = require('../models/CareerRecommendation');
const InternshipRecommendation = require('../models/InternshipRecommendation');
const LearningProgress = require('../models/LearningProgress');
const ReminderSchedule = require('../models/ReminderSchedule');
const EngagementMetric = require('../models/EngagementMetric');
const UserAnalytics = require('../models/UserAnalytics');

// Services
const PulseNotificationService = require('../services/pulseNotificationService');
const PulseAnalyticsService = require('../services/pulseAnalyticsService');
const NotificationPrioritizer = require('../services/notificationPrioritizer');
const CareerInsightsEngine = require('../services/careerInsightsEngine');
const InternshipMatcher = require('../services/internshipMatcher');
const GrowthCalculator = require('../services/growthCalculator');
const ReminderEngine = require('../services/reminderEngine');
const EngagementEngine = require('../services/engagementEngine');
// Repositories
const NotificationRepository = require('../repositories/notificationRepository');
const ActivityRepository = require('../repositories/activityRepository');
const CareerRepository = require('../repositories/careerRepository');
const AnalyticsRepository = require('../repositories/analyticsRepository');
const GrowthRepository = require('../repositories/growthRepository');
let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ ${testName}`);
    passed++;
  } else {
    console.log(`  ❌ ${testName}`);
    failed++;
  }
}

async function runTests() {
  try {
    await connectDatabase();
    console.log('✅ Connected to MongoDB.\n');

    // Clean up collections
    await User.deleteMany({ email: 'charlie@campusx.edu' });
    await Profile.deleteMany({});
    await Notification.deleteMany({});
    await NotificationPreference.deleteMany({});
    await UserActivity.deleteMany({});
    await ActivityTimeline.deleteMany({});
    await GrowthMetrics.deleteMany({});
    await CareerInsight.deleteMany({});
    await CareerRecommendation.deleteMany({});
    await InternshipRecommendation.deleteMany({});
    await LearningProgress.deleteMany({});
    await ReminderSchedule.deleteMany({});
    await EngagementMetric.deleteMany({});
    await UserAnalytics.deleteMany({});

    console.log('═══ STEP 0: Setup Test User ═══');

    // Create User Charlie (CSE, Sem 3)
    const charlie = await User.create({
      email: 'charlie@campusx.edu',
      passwordHash: 'charliehash',
      firstName: 'Charlie',
      lastName: 'Brown',
      college: 'CampusX College',
      branch: 'CSE',
      semester: '3',
      role: 'student',
      status: 'active',
      emailVerified: true,
      isVerified: true,
    });

    const charlieProfile = await Profile.create({
      userId: charlie._id,
      username: 'charlie_cse',
      bio: 'Junior coder.',
      skills: ['HTML', 'CSS', 'JavaScript'],
      interests: ['Web Development'],
      profileLevel: 'beginner',
      profileCompletionScore: 60,
      onboardingCompleted: true,
    });

    assert(charlie._id !== undefined, 'Created Charlie test user and profile');
    console.log('');

    console.log('═══ TEST 1: Smart Notification Prioritizer & Channels ═══');

    // Test priority assessor
    const prioLikes = NotificationPrioritizer.assessPriority('like', 'New Like', 'Alice liked your post');
    const prioInvite = NotificationPrioritizer.assessPriority('team_invite', 'Team Invite', 'You have been invited to join Team Core');
    const prioCritical = NotificationPrioritizer.assessPriority('trending', 'Security Alert', 'Warning: Unauthorized login compromise detected!');

    assert(prioLikes === 'low', 'Priority for likes is LOW');
    assert(prioInvite === 'high', 'Priority for team invitation is HIGH');
    assert(prioCritical === 'critical', 'Priority for account compromise keyword match is CRITICAL');

    // Save preference
    await NotificationRepository.updatePreferences(charlie._id, {
      likes: { email: false, push: false, inApp: true }, // inApp only
      invitations: { email: true, push: true, inApp: true }, // all channels
    });

    // Send a like notification (should save inApp, but suppress email/push logs)
    const notificationLike = await PulseNotificationService.sendNotification(
      charlie._id,
      null,
      'like',
      null,
      'New Like',
      'Someone liked your project'
    );
    assert(notificationLike !== null && notificationLike.priority === 'low', 'Sent low-priority Like notification (In-App allowed)');

    // Mark as read
    const readDoc = await PulseNotificationService.markRead(charlie._id, notificationLike._id);
    assert(readDoc.isRead === true, 'Notification marked as read successfully');
    console.log('');

    console.log('═══ TEST 2: Activity Tracking & Timeline Aggregates ═══');

    // Track a couple of actions
    await PulseAnalyticsService.trackActivity(charlie._id, 'post_created', { topic: 'React Context API' });
    await PulseAnalyticsService.trackActivity(charlie._id, 'project_uploaded', { name: 'CampusX Portal' });
    await PulseAnalyticsService.trackActivity(charlie._id, 'learning_completed', { skill: 'Node.js' });

    const timeline = await ActivityRepository.getTimeline(charlie._id);
    assert(timeline.length === 1, 'Aggregated timeline logs inside a daily bucket');
    assert(
      timeline[0].counts.postsCreated === 1 && timeline[0].counts.projectsUploaded === 1 && timeline[0].counts.learningActivity === 1,
      'Correctly incremented timeline activity counters'
    );
    assert(timeline[0].totalScore === 10 + 35 + 15, `Evaluated correct action weight totals (Score: ${timeline[0].totalScore})`);
    console.log('');

    console.log('═══ TEST 3: User Growth Engine ═══');

    // Recalculate and fetch growth metrics
    const growth = await GrowthRepository.getGrowthMetrics(charlie._id);
    assert(growth.profileGrowthScore === 60, `Calculated Profile score: ${growth.profileGrowthScore}%`);
    assert(growth.skillGrowthScore === 75, `Calculated Skill variety score (3 skills): ${growth.skillGrowthScore}%`);
    assert(growth.careerReadinessScore > 0, `Calculated Career Readiness Index: ${growth.careerReadinessScore}%`);
    assert(growth.history.length === 3, 'Logged historical score entry per tracked activity event');
    console.log('');

    console.log('═══ TEST 4: Career Insights & Internship Recommendations ═══');

    // Trigger AI career path match analysis
    const careerMatches = await PulseAnalyticsService.generateCareerPathInsights(charlie._id);
    
    assert(careerMatches.recommendations.length > 0, 'Compiled career recommendations list');
    assert(
      careerMatches.insights.identifiedGaps.length > 0 && careerMatches.insights.roadmapsSuggested.length > 0,
      'Identified technical skill gaps and generated custom roadmaps'
    );
    
    const matchedJob = careerMatches.internships.find(o => o.title === 'Software Developer Intern');
    assert(
      matchedJob !== undefined && matchedJob.matchScore >= 50,
      `Matched developer opportunity: ${matchedJob?.title} at ${matchedJob?.company} (Match Score: ${matchedJob?.matchScore}%)`
    );

    // Update match status
    const matchedJobInDb = await InternshipRecommendation.findOne({ userId: charlie._id, title: 'Software Developer Intern' });
    const updatedJob = await CareerRepository.updateInternshipStatus(matchedJobInDb._id, 'applied');
    assert(updatedJob.status === 'applied', 'Internship status updated from active to applied');
    console.log('');

    console.log('═══ TEST 5: Reminder & Engagement Churn Evaluation ═══');

    // Evaluate reminders
    const remindersList = await PulseAnalyticsService.scheduleReminders(charlie._id);
    assert(remindersList.length > 0, 'Dispatched alert warning schedules');
    assert(remindersList.some(r => r.type === 'profile_completeness'), 'Enqueued reminder for incomplete profile details');

    // Log user active session duration
    const session = await PulseAnalyticsService.logSession(charlie._id, 1200000); // 20 mins
    assert(session.sessionCount === 1 && session.totalTimeSpentMs === 1200000, 'Engagement logs tracked active session duration time');

    const riskLevel = await EngagementMetric.findOne({ userId: charlie._id });
    assert(riskLevel.churnRisk === 'low' && riskLevel.status === 'active', 'User classified with low churn risk and active status');
    console.log('');

    console.log('═══ TEST 6: Consolidated Dashboard Analytics Profile ═══');

    const dashboard = await PulseAnalyticsService.getConsolidatedDashboard(charlie._id);
    assert(dashboard.analyticsProfile.overallActivityScore === 60, 'Main aggregate stats populated on dashboard profile');
    assert(dashboard.reminders.length > 0, 'Active reminder list bound to dashboard display object');
    console.log('');

    console.log('═══ CLEANUP ═══');
    await User.deleteMany({ email: 'charlie@campusx.edu' });
    await Profile.deleteMany({});
    await Notification.deleteMany({});
    await NotificationPreference.deleteMany({});
    await UserActivity.deleteMany({});
    await ActivityTimeline.deleteMany({});
    await GrowthMetrics.deleteMany({});
    await CareerInsight.deleteMany({});
    await CareerRecommendation.deleteMany({});
    await InternshipRecommendation.deleteMany({});
    await LearningProgress.deleteMany({});
    await ReminderSchedule.deleteMany({});
    await EngagementMetric.deleteMany({});
    await UserAnalytics.deleteMany({});
    console.log('  🧹 Cleaned up test data.');
    console.log('');

    console.log('═══════════════════════════════════════════');
    console.log('  PULSENOTIFY AI SYSTEM TEST RESULTS');
    console.log('═══════════════════════════════════════════');
    console.log(`  ✅ Passed: ${passed}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  Total:   ${passed + failed}`);
    console.log('═══════════════════════════════════════════');

    if (failed > 0) {
      console.log('\n⚠️  Some tests failed. Review the output above.\n');
      process.exit(1);
    } else {
      console.log('\n🎉 All PulseNotify AI tests passed successfully!\n');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Test runner crashed:', error);
    process.exit(1);
  }
}

runTests();
