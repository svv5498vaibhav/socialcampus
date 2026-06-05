const UserReputation = require('../models/UserReputation');
const ReputationRepository = require('../repositories/reputationRepository');
const { getIO } = require('./socketService');

const REPUTATION_RULES = {
  project_liked: { change: 10, breakdownField: 'contentQuality' },
  project_saved: { change: 5, breakdownField: 'projectSuccess' },
  comment_helpful: { change: 5, breakdownField: 'helpfulComments' },
  answer_helpful: { change: 15, breakdownField: 'projectSuccess' },
  spam_flagged: { change: -50, breakdownField: 'communityImpact' },
  content_deleted: { change: -100, breakdownField: 'communityImpact' },
  consistency_bonus: { change: 2, breakdownField: 'consistency' },
  event_participation: { change: 10, breakdownField: 'communityImpact' },
  hackathon_win: { change: 100, breakdownField: 'communityImpact' },
  quality_content: { change: 15, breakdownField: 'contentQuality' },
  mentoring: { change: 20, breakdownField: 'helpfulComments' },
};

/**
 * Update user reputation
 * @param {string} userId 
 * @param {string} reason 
 * @param {string|null} sourceId 
 * @param {object} metadata 
 */
const updateReputation = async (userId, reason, sourceId = null, metadata = {}) => {
  const rule = REPUTATION_RULES[reason];
  let scoreChange = 0;

  if (reason === 'admin_adjustment') {
    scoreChange = typeof metadata.change === 'number' ? metadata.change : 0;
  } else if (rule) {
    scoreChange = rule.change;
  } else {
    throw new Error(`Invalid reputation update reason: ${reason}`);
  }

  if (scoreChange === 0) return null;

  // Use repository for atomic change with sub-score updates
  const rep = await ReputationRepository.applyChange(userId, scoreChange, reason, sourceId);
  if (!rep) {
    // If no record, create one first then apply
    const User = require('../models/User');
    const user = await User.findById(userId).select('college branch').lean();
    await ReputationRepository.findOrCreate(userId, { college: user?.college, branch: user?.branch });
    return await ReputationRepository.applyChange(userId, scoreChange, reason, sourceId);
  }

  // Trigger WebSocket notification with enriched data
  try {
    const io = getIO();
    io.to(`user:${userId}`).emit('reputation-update', {
      reputationScore: rep.reputationScore,
      tier: rep.tier,
      trustScore: rep.trustScore,
      change: scoreChange,
      reason,
    });
  } catch (err) {
    // Socket might not be initialized
  }

  // Trigger Badge engine verification (dynamic import to prevent circular dependency)
  const badgeService = require('./badgeService');
  badgeService.checkBadges(userId, 'reputation', rep.reputationScore).catch((err) =>
    console.error(`Error checking reputation badges for user ${userId}:`, err.message)
  );

  // Trigger reputation-threshold achievement checks
  const achievementService = require('./achievementService');
  achievementService.checkAndUnlock(userId, 'reputation_threshold', rep.reputationScore).catch((err) =>
    console.error(`Error checking reputation achievements for user ${userId}:`, err.message)
  );

  return rep;
};

module.exports = {
  updateReputation,
  REPUTATION_RULES,
};
