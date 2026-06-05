const express = require('express');
const router = express.Router();
const GamificationController = require('../controllers/gamificationController');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const {
  getLeaderboardValidation,
  updatePointsValidation,
  getHistoryValidation,
  redeemRewardValidation,
  fulfillRewardValidation,
  refundRewardValidation,
} = require('../validators/gamificationValidator');

// All gamification routes require authentication
router.use(authenticate);

// ── Leaderboard Endpoints ──
router.get('/leaderboard', getLeaderboardValidation, GamificationController.getOverallLeaderboard);
router.get('/leaderboard/branch', getLeaderboardValidation, GamificationController.getBranchLeaderboard);
router.get('/leaderboard/college', getLeaderboardValidation, GamificationController.getCollegeLeaderboard);
router.get('/leaderboard/weekly', getLeaderboardValidation, GamificationController.getWeeklyLeaderboard);
router.get('/leaderboard/monthly', getLeaderboardValidation, GamificationController.getMonthlyLeaderboard);

// ── Badges & Achievements Endpoints ──
router.get('/achievements', GamificationController.getAchievements);
router.get('/badges', GamificationController.getBadges);

// ── Reputation Endpoints ──
router.get('/reputation', GamificationController.getReputation);

// ── Ranking History Endpoints ──
router.get('/ranking/history', getHistoryValidation, GamificationController.getRankingHistory);

// ── Q&A Gamification Actions ──
router.post('/comments/:commentId/helpful', GamificationController.markCommentHelpful);

// ── Reward Endpoints ──
router.get('/rewards', GamificationController.getRewards);
router.post('/rewards/redeem', redeemRewardValidation, GamificationController.redeemReward);
router.get('/rewards/history', GamificationController.getRewardHistory);
router.post('/rewards/admin/fulfill', authorize('admin', 'moderator'), fulfillRewardValidation, GamificationController.fulfillRewardTransaction);
router.post('/rewards/admin/refund', authorize('admin'), refundRewardValidation, GamificationController.refundRewardTransaction);

// ── Points Management (Admin Only) ──
router.post('/points/update', authorize('admin'), updatePointsValidation, GamificationController.updatePoints);

module.exports = router;

