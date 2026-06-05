const User = require('../models/User');
const UserPoint = require('../models/UserPoint');
const UserReputation = require('../models/UserReputation');
const LeaderboardRepository = require('../repositories/leaderboardRepository');
const PointsRepository = require('../repositories/pointsRepository');
const leaderboardService = require('./leaderboardService');

class GamificationCron {
  /**
   * Compiles and stores rank/point snapshots for all users
   * Also generates leaderboard snapshots for analytics
   */
  static async runDailySnapshot() {
    console.log('⏰ Gamification Cron: Starting daily ranking snapshot compile...');
    const startTime = Date.now();
    const todayStr = new Date().toISOString().split('T')[0];
    const today = new Date();

    try {
      // ── Step 1: Weekly/Monthly Point Resets ──
      const currentWeekKey = `${today.getFullYear()}-W${String(Math.ceil(((today - new Date(today.getFullYear(), 0, 1)) / 86400000 + new Date(today.getFullYear(), 0, 1).getDay() + 1) / 7)).padStart(2, '0')}`;
      const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

      const weeklyReset = await PointsRepository.resetWeeklyPoints(currentWeekKey);
      const monthlyReset = await PointsRepository.resetMonthlyPoints(currentMonthKey);
      console.log(`  ↻ Weekly resets: ${weeklyReset.modifiedCount || 0} users | Monthly resets: ${monthlyReset.modifiedCount || 0} users`);

      // ── Step 2: Individual User Ranking Snapshots ──
      const users = await User.find({ status: 'active' }).select('_id college branch semester').lean();
      console.log(`  Found ${users.length} active users to snapshot.`);

      let processedCount = 0;
      const leaderboardScores = { overall: [], branch: {}, college: {} };

      for (const user of users) {
        const userId = user._id;

        const [pointsObj, repObj] = await Promise.all([
          UserPoint.findOne({ userId }).select('lifetimePoints weeklyPoints monthlyPoints').lean(),
          UserReputation.findOne({ userId }).select('reputationScore').lean(),
        ]);

        const points = pointsObj ? pointsObj.lifetimePoints : 0;
        const reputation = repObj ? repObj.reputationScore : 1;

        // Get previous day's ranking for delta calculation
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const [overallRank, prevSnapshot] = await Promise.all([
          leaderboardService.getUserRankInLeaderboard('leaderboard:overall', userId),
          LeaderboardRepository.getUserRankTrend(userId, 'overall', 1).then(arr => arr[0] || null),
        ]);

        const previousRank = prevSnapshot ? prevSnapshot.currentRank : null;
        const currentRank = overallRank || processedCount + 1;
        const rankChange = previousRank ? previousRank - currentRank : 0;

        await LeaderboardRepository.saveRankingEntry(userId, 'overall', '', {
          snapshotDate: todayStr,
          currentRank,
          previousRank,
          rankChange,
          points,
          reputation,
          totalParticipants: users.length,
        });

        // Collect for leaderboard snapshot
        leaderboardScores.overall.push({ rank: currentRank, userId, score: points, previousRank, rankChange });

        // Branch-scoped snapshot
        if (user.branch) {
          if (!leaderboardScores.branch[user.branch]) leaderboardScores.branch[user.branch] = [];
          leaderboardScores.branch[user.branch].push({ rank: 0, userId, score: points, previousRank: null, rankChange: 0 });
        }

        // College-scoped snapshot
        if (user.college) {
          if (!leaderboardScores.college[user.college]) leaderboardScores.college[user.college] = [];
          leaderboardScores.college[user.college].push({ rank: 0, userId, score: points, previousRank: null, rankChange: 0 });
        }

        processedCount++;
      }

      // ── Step 3: Generate Leaderboard Snapshots ──
      // Overall snapshot
      const overallSorted = leaderboardScores.overall.sort((a, b) => b.score - a.score).slice(0, 500);
      overallSorted.forEach((e, i) => { e.rank = i + 1; });
      const overallStats = GamificationCron._computeStats(leaderboardScores.overall.map(e => e.score));
      await LeaderboardRepository.saveSnapshot('overall', '', todayStr, overallSorted, overallStats);

      // Branch snapshots
      for (const [branch, entries] of Object.entries(leaderboardScores.branch)) {
        entries.sort((a, b) => b.score - a.score);
        entries.forEach((e, i) => { e.rank = i + 1; });
        const stats = GamificationCron._computeStats(entries.map(e => e.score));
        await LeaderboardRepository.saveSnapshot('branch', branch, todayStr, entries.slice(0, 500), stats);
      }

      // College snapshots
      for (const [college, entries] of Object.entries(leaderboardScores.college)) {
        entries.sort((a, b) => b.score - a.score);
        entries.forEach((e, i) => { e.rank = i + 1; });
        const stats = GamificationCron._computeStats(entries.map(e => e.score));
        await LeaderboardRepository.saveSnapshot('college', college, todayStr, entries.slice(0, 500), stats);
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Gamification Cron: Snapshot completed. Processed ${processedCount}/${users.length} users in ${duration}s.`);
    } catch (error) {
      console.error('❌ Gamification Cron: Daily snapshot compilation failed:', error);
    }
  }

  /**
   * Compute aggregated statistics for a set of scores
   */
  static _computeStats(scores) {
    if (scores.length === 0) {
      return { totalParticipants: 0, averageScore: 0, medianScore: 0, topScore: 0, bottomScore: 0, standardDeviation: 0 };
    }
    const sorted = [...scores].sort((a, b) => a - b);
    const total = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);
    const avg = sum / total;
    const median = total % 2 === 0 ? (sorted[total / 2 - 1] + sorted[total / 2]) / 2 : sorted[Math.floor(total / 2)];
    const variance = sorted.reduce((acc, s) => acc + Math.pow(s - avg, 2), 0) / total;
    const stddev = Math.sqrt(variance);

    return {
      totalParticipants: total,
      averageScore: Math.round(avg * 100) / 100,
      medianScore: Math.round(median * 100) / 100,
      topScore: sorted[total - 1],
      bottomScore: sorted[0],
      standardDeviation: Math.round(stddev * 100) / 100,
    };
  }

  /**
   * Schedules the next snapshot execution for 12:05 AM (midnight)
   */
  static startScheduler() {
    const scheduleNextRun = () => {
      const now = new Date();
      const nextRun = new Date();
      nextRun.setDate(now.getDate() + 1);
      nextRun.setHours(0, 5, 0, 0); // 12:05 AM

      const msUntilRun = nextRun - now;
      console.log(`⏰ Gamification Cron: Scheduled next ranking snapshot in ${(msUntilRun / 3600000).toFixed(2)} hours (at 12:05 AM).`);

      setTimeout(() => {
        GamificationCron.runDailySnapshot()
          .then(() => scheduleNextRun())
          .catch((err) => {
            console.error('Daily snapshot failed:', err);
            scheduleNextRun();
          });
      }, msUntilRun);
    };

    // Trigger initial snapshot check on startup to ensure we don't miss today's snap
    const todayStr = new Date().toISOString().split('T')[0];
    const LeaderboardSnapshot = require('../models/LeaderboardSnapshot');
    LeaderboardSnapshot.findOne({ snapshotDate: todayStr })
      .then((exists) => {
        if (!exists) {
          console.log('⏰ Gamification Cron: No snapshot found for today. Compiling snapshot on startup...');
          GamificationCron.runDailySnapshot().catch((err) =>
            console.error('Startup snapshot compile failed:', err)
          );
        } else {
          console.log("⏰ Gamification Cron: Today's snapshot already exists.");
        }
        scheduleNextRun();
      })
      .catch((err) => {
        console.error('Startup snapshot check failed:', err);
        scheduleNextRun();
      });
  }
}

module.exports = GamificationCron;
