/**
 * Phase 2 Integration Test — RankForge AI Database Layer
 * Validates all enhanced models, new collections, and repository operations
 *
 * Run: node server/tests/testPhase2.cjs
 */
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
const connectDatabase = require('../config/database');

// Models
const UserPoint = require('../models/UserPoint');
const UserReputation = require('../models/UserReputation');
const Achievement = require('../models/Achievement');
const UserAchievement = require('../models/UserAchievement');
const Badge = require('../models/Badge');
const UserBadge = require('../models/UserBadge');
const RankingHistory = require('../models/RankingHistory');
const Activity = require('../models/Activity');
const AntiCheatLog = require('../models/AntiCheatLog');
const RewardTransaction = require('../models/RewardTransaction');
const LeaderboardSnapshot = require('../models/LeaderboardSnapshot');
const Reward = require('../models/Reward');
const PointsLog = require('../models/PointsLog');

// Repositories
const PointsRepository = require('../repositories/pointsRepository');
const ReputationRepository = require('../repositories/reputationRepository');
const AchievementRepository = require('../repositories/achievementRepository');
const BadgeRepository = require('../repositories/badgeRepository');
const AntiCheatRepository = require('../repositories/antiCheatRepository');
const LeaderboardRepository = require('../repositories/leaderboardRepository');

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

    // Create a test user ID for all tests
    const testUserId = new mongoose.Types.ObjectId();
    const testUserId2 = new mongoose.Types.ObjectId();

    // ═══════════════════════════════════════════
    //  TEST 1: Enhanced UserPoint Model
    // ═══════════════════════════════════════════
    console.log('═══ TEST 1: Enhanced UserPoint Model ═══');

    const up = new UserPoint({
      userId: testUserId,
      currentPoints: 1500,
      lifetimePoints: 3200,
      weeklyPoints: 250,
      monthlyPoints: 800,
      weekKey: '2026-W22',
      monthKey: '2026-06',
      categoryPoints: {
        projects: 500,
        comments: 200,
        community: 300,
        events: 100,
        helpfulness: 400,
        innovation: 200,
      },
      streak: {
        currentStreak: 14,
        longestStreak: 30,
        lastActiveDate: '2026-06-01',
      },
      college: 'Test University',
      branch: 'Computer Science',
      semester: '6th',
    });
    await up.save();

    assert(up.weeklyPoints === 250, 'weeklyPoints stored correctly');
    assert(up.monthlyPoints === 800, 'monthlyPoints stored correctly');
    assert(up.categoryPoints.projects === 500, 'categoryPoints.projects stored');
    assert(up.categoryPoints.helpfulness === 400, 'categoryPoints.helpfulness stored');
    assert(up.streak.currentStreak === 14, 'streak.currentStreak stored');
    assert(up.streak.longestStreak === 30, 'streak.longestStreak stored');
    assert(up.college === 'Test University', 'denormalized college field');
    assert(up.branch === 'Computer Science', 'denormalized branch field');

    // Test scoped leaderboard query
    const page = await PointsRepository.getLeaderboardPage('college', 'Test University', 'lifetimePoints', 1, 10);
    assert(page.entries.length >= 1, 'getLeaderboardPage returns results for college scope');

    // Test getUserRank
    const rank = await PointsRepository.getUserRank(testUserId, 'overall', '', 'lifetimePoints');
    assert(rank >= 1, 'getUserRank returns valid rank');
    console.log('');

    // ═══════════════════════════════════════════
    //  TEST 2: Enhanced UserReputation Model
    // ═══════════════════════════════════════════
    console.log('═══ TEST 2: Enhanced UserReputation Model ═══');

    const rep = new UserReputation({
      userId: testUserId,
      reputationScore: 2500,
      trustScore: 85,
      contributionScore: 500,
      communityScore: 300,
      activityScore: 200,
      qualityScore: 75,
      college: 'Test University',
      branch: 'Computer Science',
    });
    await rep.save();

    assert(rep.trustScore === 85, 'trustScore stored correctly');
    assert(rep.contributionScore === 500, 'contributionScore stored');
    assert(rep.communityScore === 300, 'communityScore stored');
    assert(rep.qualityScore === 75, 'qualityScore stored');
    assert(rep.tier === 'expert', 'tier auto-calculated as expert (2500)');

    // Test tier recalculation
    rep.reputationScore = 50;
    rep.recalculateTier();
    assert(rep.tier === 'contributor', 'tier recalculated to contributor (50)');
    rep.reputationScore = 2500;
    rep.recalculateTier();
    assert(rep.tier === 'expert', 'tier restored to expert (2500)');

    // Test history cap
    for (let i = 0; i < 210; i++) {
      rep.history.push({ change: 1, reason: 'consistency_bonus', createdAt: new Date() });
    }
    await rep.save();
    assert(rep.history.length <= 200, 'history capped at 200 entries on save');
    console.log('');

    // ═══════════════════════════════════════════
    //  TEST 3: Enhanced Achievement Model
    // ═══════════════════════════════════════════
    console.log('═══ TEST 3: Enhanced Achievement Model ═══');

    const achievements = await Achievement.find({}).lean();
    assert(achievements.length >= 20, `${achievements.length} achievements seeded`);

    const contentAch = achievements.filter(a => a.category === 'content');
    const innovationAch = achievements.filter(a => a.category === 'innovation');
    assert(contentAch.length >= 1, 'Content category achievements exist');
    assert(innovationAch.length >= 1, 'Innovation category achievements exist');

    const legendaryAch = achievements.filter(a => a.tier === 'legendary');
    assert(legendaryAch.length >= 1, 'Legendary tier achievements exist');

    const streakAch = achievements.filter(a => a.milestoneType === 'streak_days');
    assert(streakAch.length >= 1, 'Streak-based achievements exist');
    console.log('');

    // ═══════════════════════════════════════════
    //  TEST 4: Enhanced Badge Model
    // ═══════════════════════════════════════════
    console.log('═══ TEST 4: Enhanced Badge Model ═══');

    const badges = await Badge.find({}).lean();
    assert(badges.length >= 15, `${badges.length} badges seeded`);

    const skillBadges = badges.filter(b => b.category === 'skill');
    const communityBadges = badges.filter(b => b.category === 'community');
    assert(skillBadges.length >= 1, 'Skill category badges exist');
    assert(communityBadges.length >= 1, 'Community category badges exist');

    const epicBadges = badges.filter(b => b.rarity === 'epic');
    assert(epicBadges.length >= 1, 'Epic rarity badges exist');

    const legendaryBadges = badges.filter(b => b.rarity === 'legendary');
    assert(legendaryBadges.length >= 1, 'Legendary rarity badges exist');

    // Test badge repository: get active badges
    const activeBadges = await BadgeRepository.getActive({ tier: 'gold' });
    assert(activeBadges.length >= 1, 'BadgeRepository.getActive filters by tier');
    console.log('');

    // ═══════════════════════════════════════════
    //  TEST 5: Enhanced RankingHistory Model
    // ═══════════════════════════════════════════
    console.log('═══ TEST 5: Enhanced RankingHistory Model ═══');

    const todayStr = new Date().toISOString().split('T')[0];
    const rh = new RankingHistory({
      userId: testUserId,
      leaderboardType: 'overall',
      scopeValue: '',
      currentRank: 5,
      previousRank: 8,
      rankChange: 3,
      points: 3200,
      reputation: 2500,
      percentile: 95,
      snapshotDate: todayStr,
      totalParticipants: 100,
    });
    await rh.save();

    assert(rh.leaderboardType === 'overall', 'leaderboardType stored');
    assert(rh.currentRank === 5, 'currentRank stored');
    assert(rh.previousRank === 8, 'previousRank stored');
    assert(rh.rankChange === 3, 'rankChange stored (positive = moved up)');
    assert(rh.percentile === 95, 'percentile stored');
    assert(rh.totalParticipants === 100, 'totalParticipants stored');

    // Test leaderboard repository: rank trend
    const trend = await LeaderboardRepository.getUserRankTrend(testUserId, 'overall', 7);
    assert(trend.length >= 1, 'getUserRankTrend returns data');
    console.log('');

    // ═══════════════════════════════════════════
    //  TEST 6: Enhanced Activity Model
    // ═══════════════════════════════════════════
    console.log('═══ TEST 6: Enhanced Activity Model ═══');

    const act = new Activity({
      userId: testUserId,
      action: 'badge_earned',
      targetId: new mongoose.Types.ObjectId(),
      targetType: 'badge',
      pointsImpact: 100,
      ipAddress: '192.168.1.1',
    });
    await act.save();

    assert(act.action === 'badge_earned', 'New gamification action type works');
    assert(act.targetType === 'badge', 'targetType stored');
    assert(act.pointsImpact === 100, 'pointsImpact stored');
    assert(act.ipAddress === '192.168.1.1', 'ipAddress stored for anti-cheat');
    console.log('');

    // ═══════════════════════════════════════════
    //  TEST 7: NEW AntiCheatLog Model
    // ═══════════════════════════════════════════
    console.log('═══ TEST 7: AntiCheatLog Model ═══');

    const acl = await AntiCheatRepository.logViolation({
      userId: testUserId,
      violationType: 'fake_likes',
      severity: 'medium',
      evidence: { targetPostId: 'post123', likeCount: 50, timeWindow: '60s' },
      ipAddress: '192.168.1.1',
      detectionMethod: 'middleware',
    });

    assert(acl.violationType === 'fake_likes', 'violationType stored');
    assert(acl.severity === 'medium', 'severity stored');
    assert(acl.status === 'open', 'default status is open');
    assert(acl.evidence.likeCount === 50, 'evidence blob stored');

    // Test violation count
    const count = await AntiCheatRepository.countRecentViolations(testUserId, 'fake_likes', 24);
    assert(count >= 1, 'countRecentViolations returns correct count');

    // Test case resolution
    const resolved = await AntiCheatRepository.resolveCase(acl._id, testUserId2, 'warning_issued', 0, 'First offense — warning.');
    assert(resolved.status === 'penalized', 'case resolved with correct status');
    assert(resolved.actionTaken === 'warning_issued', 'actionTaken recorded');
    console.log('');

    // ═══════════════════════════════════════════
    //  TEST 8: NEW RewardTransaction Model
    // ═══════════════════════════════════════════
    console.log('═══ TEST 8: RewardTransaction Model ═══');

    const reward = await Reward.findOne({});
    const rt = new RewardTransaction({
      userId: testUserId,
      rewardId: reward._id,
      pointsSpent: reward.pointsCost,
      pointsBalanceBefore: 1500,
      pointsBalanceAfter: 1500 - reward.pointsCost,
      status: 'pending',
    });
    await rt.save();

    assert(rt.pointsSpent === reward.pointsCost, 'pointsSpent stored');
    assert(rt.status === 'pending', 'default status is pending');
    assert(rt.pointsBalanceBefore === 1500, 'balance before stored');
    assert(rt.pointsBalanceAfter === 1500 - reward.pointsCost, 'balance after stored');
    console.log('');

    // ═══════════════════════════════════════════
    //  TEST 9: NEW LeaderboardSnapshot Model
    // ═══════════════════════════════════════════
    console.log('═══ TEST 9: LeaderboardSnapshot Model ═══');

    const snapshot = await LeaderboardRepository.saveSnapshot(
      'overall',
      '',
      todayStr,
      [
        { rank: 1, userId: testUserId, score: 3200, previousRank: 2, rankChange: 1 },
        { rank: 2, userId: testUserId2, score: 2800, previousRank: 1, rankChange: -1 },
      ],
      {
        totalParticipants: 100,
        averageScore: 1200,
        medianScore: 900,
        topScore: 3200,
        bottomScore: 10,
        standardDeviation: 800,
      }
    );

    assert(snapshot.leaderboardType === 'overall', 'snapshot leaderboardType stored');
    assert(snapshot.topEntries.length === 2, 'snapshot topEntries stored');
    assert(snapshot.stats.totalParticipants === 100, 'snapshot stats stored');
    assert(snapshot.stats.standardDeviation === 800, 'snapshot stddev stored');

    // Test snapshot history
    const snapHistory = await LeaderboardRepository.getSnapshotHistory('overall', '', 7);
    assert(snapHistory.length >= 1, 'getSnapshotHistory returns data');
    console.log('');

    // ═══════════════════════════════════════════
    //  TEST 10: Repository Layer
    // ═══════════════════════════════════════════
    console.log('═══ TEST 10: Repository Layer Operations ═══');

    // Achievement Repository
    const activeAch = await AchievementRepository.getActive({ category: 'content' });
    assert(activeAch.length >= 1, 'AchievementRepository.getActive filters by category');

    const progress = await AchievementRepository.checkMilestoneProgress(testUserId, 'post_count', 5);
    assert(progress.length >= 1, 'checkMilestoneProgress returns progress array');
    assert(progress[0].progress !== undefined, 'progress has percentage field');

    // Reputation Repository: tier distribution
    const tierDist = await ReputationRepository.getTierDistribution();
    assert(Array.isArray(tierDist), 'getTierDistribution returns array');

    // Leaderboard Repository: percentile
    const percentile = await LeaderboardRepository.computePercentile('overall', '', 3200);
    assert(typeof percentile === 'number', 'computePercentile returns a number');
    console.log('');

    // ═══════════════════════════════════════════
    //  CLEANUP
    // ═══════════════════════════════════════════
    console.log('═══ CLEANUP ═══');
    await UserPoint.deleteMany({ userId: { $in: [testUserId, testUserId2] } });
    await UserReputation.deleteMany({ userId: { $in: [testUserId, testUserId2] } });
    await RankingHistory.deleteMany({ userId: { $in: [testUserId, testUserId2] } });
    await Activity.deleteMany({ userId: { $in: [testUserId, testUserId2] } });
    await AntiCheatLog.deleteMany({ userId: { $in: [testUserId, testUserId2] } });
    await RewardTransaction.deleteMany({ userId: { $in: [testUserId, testUserId2] } });
    await LeaderboardSnapshot.deleteMany({ snapshotDate: todayStr });
    console.log('  🧹 Test data cleaned up.');
    console.log('');

    // ═══════════════════════════════════════════
    //  SUMMARY
    // ═══════════════════════════════════════════
    console.log('═══════════════════════════════════════════');
    console.log('  PHASE 2 INTEGRATION TEST RESULTS');
    console.log('═══════════════════════════════════════════');
    console.log(`  ✅ Passed: ${passed}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  Total:   ${passed + failed}`);
    console.log('═══════════════════════════════════════════');

    if (failed > 0) {
      console.log('\n⚠️  Some tests failed. Review the output above.\n');
      process.exit(1);
    } else {
      console.log('\n🎉 All Phase 2 tests passed!\n');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Test runner crashed:', error);
    process.exit(1);
  }
}

runTests();
