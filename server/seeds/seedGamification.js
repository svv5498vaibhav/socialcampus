const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDatabase = require('../config/database');
const Badge = require('../models/Badge');
const Achievement = require('../models/Achievement');
const Reward = require('../models/Reward');

// ═══════════════════════════════════════════════════════
//  BADGES — Enhanced with category, color, rarity, rewards
// ═══════════════════════════════════════════════════════

const defaultBadges = [
  // ── Bronze Tier ──
  {
    key: 'beginner',
    name: 'Beginner',
    tier: 'bronze',
    category: 'achievement',
    description: 'Complete your first activity on CampusX',
    iconUrl: '/assets/badges/beginner.png',
    color: '#CD7F32',
    rarity: 'common',
    rewardPoints: 25,
    rewardReputation: 0,
    rules: { metric: 'activity_count', threshold: 1 },
    sortOrder: 1,
  },
  {
    key: 'contributor',
    name: 'Contributor',
    tier: 'bronze',
    category: 'community',
    description: 'Post at least 5 discussions or resources',
    iconUrl: '/assets/badges/contributor.png',
    color: '#CD7F32',
    rarity: 'common',
    rewardPoints: 50,
    rewardReputation: 5,
    rules: { metric: 'posts_contribution', threshold: 5 },
    sortOrder: 2,
  },
  {
    key: 'problem_solver',
    name: 'Problem Solver',
    tier: 'bronze',
    category: 'skill',
    description: 'Get 5 comments/replies marked as helpful',
    iconUrl: '/assets/badges/problem_solver.png',
    color: '#CD7F32',
    rarity: 'uncommon',
    rewardPoints: 75,
    rewardReputation: 10,
    rules: { metric: 'helpful_replies', threshold: 5 },
    sortOrder: 3,
  },
  {
    key: 'first_streak',
    name: 'Streak Starter',
    tier: 'bronze',
    category: 'achievement',
    description: 'Maintain a 7-day activity streak',
    iconUrl: '/assets/badges/first_streak.png',
    color: '#CD7F32',
    rarity: 'uncommon',
    rewardPoints: 50,
    rewardReputation: 5,
    rules: { metric: 'streak_days', threshold: 7 },
    sortOrder: 4,
  },

  // ── Silver Tier ──
  {
    key: 'top_contributor',
    name: 'Top Contributor',
    tier: 'silver',
    category: 'community',
    description: 'Accumulate 1,000 reputation points',
    iconUrl: '/assets/badges/top_contributor.png',
    color: '#C0C0C0',
    rarity: 'uncommon',
    rewardPoints: 100,
    rewardReputation: 25,
    rules: { metric: 'reputation', threshold: 1000 },
    sortOrder: 5,
  },
  {
    key: 'mentor',
    name: 'Mentor',
    tier: 'silver',
    category: 'community',
    description: 'Get 20 comments/replies marked as helpful',
    iconUrl: '/assets/badges/mentor.png',
    color: '#C0C0C0',
    rarity: 'rare',
    rewardPoints: 150,
    rewardReputation: 30,
    rules: { metric: 'helpful_replies', threshold: 20 },
    sortOrder: 6,
  },
  {
    key: 'project_builder',
    name: 'Project Builder',
    tier: 'silver',
    category: 'skill',
    description: 'Post 5 projects',
    iconUrl: '/assets/badges/project_builder.png',
    color: '#C0C0C0',
    rarity: 'rare',
    rewardPoints: 100,
    rewardReputation: 20,
    rules: { metric: 'projects', threshold: 5 },
    sortOrder: 7,
  },
  {
    key: 'community_leader',
    name: 'Community Leader',
    tier: 'silver',
    category: 'community',
    description: 'Create 3 community events or get 50 followers',
    iconUrl: '/assets/badges/community_leader.png',
    color: '#C0C0C0',
    rarity: 'rare',
    rewardPoints: 200,
    rewardReputation: 40,
    rules: { metric: 'community_impact', eventsThreshold: 3, followersThreshold: 50 },
    sortOrder: 8,
  },
  {
    key: 'iron_streak',
    name: 'Iron Streak',
    tier: 'silver',
    category: 'achievement',
    description: 'Maintain a 30-day activity streak',
    iconUrl: '/assets/badges/iron_streak.png',
    color: '#C0C0C0',
    rarity: 'rare',
    rewardPoints: 200,
    rewardReputation: 30,
    rules: { metric: 'streak_days', threshold: 30 },
    sortOrder: 9,
  },

  // ── Gold Tier ──
  {
    key: 'innovator',
    name: 'Innovator',
    tier: 'gold',
    category: 'skill',
    description: 'Post 3 projects with qualityScore >= 75',
    iconUrl: '/assets/badges/innovator.png',
    color: '#FFD700',
    rarity: 'epic',
    rewardPoints: 300,
    rewardReputation: 50,
    rules: { metric: 'quality_projects', threshold: 3, minQualityScore: 75 },
    sortOrder: 10,
  },
  {
    key: 'campus_star',
    name: 'Campus Star',
    tier: 'gold',
    category: 'achievement',
    description: 'Reach top 50 in your college leaderboard',
    iconUrl: '/assets/badges/campus_star.png',
    color: '#FFD700',
    rarity: 'epic',
    rewardPoints: 500,
    rewardReputation: 75,
    rules: { metric: 'college_rank', threshold: 50 },
    sortOrder: 11,
  },
  {
    key: 'hackathon_hero',
    name: 'Hackathon Hero',
    tier: 'gold',
    category: 'event',
    description: 'Win 3 hackathons',
    iconUrl: '/assets/badges/hackathon_hero.png',
    color: '#FFD700',
    rarity: 'epic',
    rewardPoints: 500,
    rewardReputation: 100,
    rules: { metric: 'hackathon_wins', threshold: 3 },
    sortOrder: 12,
  },

  // ── Legendary Tier ──
  {
    key: 'campus_legend',
    name: 'Campus Legend',
    tier: 'legendary',
    category: 'achievement',
    description: 'Reach top 10 on the overall leaderboard',
    iconUrl: '/assets/badges/campus_legend.png',
    color: '#B967FF',
    rarity: 'legendary',
    rewardPoints: 1000,
    rewardReputation: 200,
    rules: { metric: 'overall_rank', threshold: 10 },
    sortOrder: 13,
  },
  {
    key: 'grand_mentor',
    name: 'Grand Mentor',
    tier: 'legendary',
    category: 'community',
    description: 'Get 100 comments/replies marked as helpful',
    iconUrl: '/assets/badges/grand_mentor.png',
    color: '#B967FF',
    rarity: 'legendary',
    rewardPoints: 1000,
    rewardReputation: 250,
    rules: { metric: 'helpful_replies', threshold: 100 },
    sortOrder: 14,
  },
  {
    key: 'unstoppable',
    name: 'Unstoppable',
    tier: 'legendary',
    category: 'achievement',
    description: 'Maintain a 100-day activity streak',
    iconUrl: '/assets/badges/unstoppable.png',
    color: '#B967FF',
    rarity: 'legendary',
    rewardPoints: 2000,
    rewardReputation: 500,
    rules: { metric: 'streak_days', threshold: 100 },
    sortOrder: 15,
  },
];

// ═══════════════════════════════════════════════════════
//  ACHIEVEMENTS — Enhanced with tier, category, rewards
// ═══════════════════════════════════════════════════════

const defaultAchievements = [
  // ── Content Achievements ──
  {
    key: 'first_post',
    name: 'First Voice',
    description: 'Publish your first post, question, or discussion',
    tier: 'bronze',
    category: 'content',
    pointsReward: 50,
    reputationReward: 5,
    iconUrl: '/assets/achievements/first_post.png',
    color: '#CD7F32',
    milestoneType: 'post_count',
    milestoneThreshold: 1,
    sortOrder: 1,
  },
  {
    key: 'prolific_writer',
    name: 'Prolific Writer',
    description: 'Publish 25 posts or discussions',
    tier: 'silver',
    category: 'content',
    pointsReward: 200,
    reputationReward: 25,
    iconUrl: '/assets/achievements/prolific_writer.png',
    color: '#C0C0C0',
    milestoneType: 'post_count',
    milestoneThreshold: 25,
    sortOrder: 2,
  },
  {
    key: 'thought_leader',
    name: 'Thought Leader',
    description: 'Publish 100 posts or discussions',
    tier: 'gold',
    category: 'content',
    pointsReward: 500,
    reputationReward: 75,
    iconUrl: '/assets/achievements/thought_leader.png',
    color: '#FFD700',
    milestoneType: 'post_count',
    milestoneThreshold: 100,
    sortOrder: 3,
  },

  // ── Innovation Achievements ──
  {
    key: 'first_project',
    name: 'First Project',
    description: 'Post your first project on the CampusX workspace',
    tier: 'bronze',
    category: 'innovation',
    pointsReward: 100,
    reputationReward: 10,
    iconUrl: '/assets/achievements/first_project.png',
    color: '#CD7F32',
    milestoneType: 'project_count',
    milestoneThreshold: 1,
    sortOrder: 4,
  },
  {
    key: 'serial_builder',
    name: 'Serial Builder',
    description: 'Post 10 projects',
    tier: 'gold',
    category: 'innovation',
    pointsReward: 500,
    reputationReward: 50,
    iconUrl: '/assets/achievements/serial_builder.png',
    color: '#FFD700',
    milestoneType: 'project_count',
    milestoneThreshold: 10,
    sortOrder: 5,
  },

  // ── Community Achievements ──
  {
    key: 'helpful_hand',
    name: 'Helpful Hand',
    description: 'Get 10 comments marked as helpful',
    tier: 'bronze',
    category: 'community',
    pointsReward: 75,
    reputationReward: 15,
    iconUrl: '/assets/achievements/helpful_hand.png',
    color: '#CD7F32',
    milestoneType: 'helpful_count',
    milestoneThreshold: 10,
    sortOrder: 6,
  },
  {
    key: 'community_hero',
    name: 'Community Hero',
    description: 'Get 50 comments marked as helpful',
    tier: 'silver',
    category: 'community',
    pointsReward: 300,
    reputationReward: 50,
    iconUrl: '/assets/achievements/community_hero.png',
    color: '#C0C0C0',
    milestoneType: 'helpful_count',
    milestoneThreshold: 50,
    sortOrder: 7,
  },

  // ── Engagement Achievements ──
  {
    key: 'likes_100',
    name: 'Popular Maker',
    description: 'Accumulate 100 likes across your posted content',
    tier: 'silver',
    category: 'engagement',
    pointsReward: 150,
    reputationReward: 20,
    iconUrl: '/assets/achievements/likes_100.png',
    color: '#C0C0C0',
    milestoneType: 'like_count',
    milestoneThreshold: 100,
    sortOrder: 8,
  },
  {
    key: 'likes_1000',
    name: 'Viral Creator',
    description: 'Accumulate 1,000 likes across your posted content',
    tier: 'gold',
    category: 'engagement',
    pointsReward: 500,
    reputationReward: 100,
    iconUrl: '/assets/achievements/likes_1000.png',
    color: '#FFD700',
    milestoneType: 'like_count',
    milestoneThreshold: 1000,
    sortOrder: 9,
  },
  {
    key: 'comment_warrior',
    name: 'Comment Warrior',
    description: 'Post 100 comments across discussions',
    tier: 'silver',
    category: 'engagement',
    pointsReward: 150,
    reputationReward: 20,
    iconUrl: '/assets/achievements/comment_warrior.png',
    color: '#C0C0C0',
    milestoneType: 'comment_count',
    milestoneThreshold: 100,
    sortOrder: 10,
  },

  // ── Milestone Achievements ──
  {
    key: 'points_500',
    name: 'Point Collector',
    description: 'Earn a total of 500 points',
    tier: 'bronze',
    category: 'milestone',
    pointsReward: 100,
    reputationReward: 10,
    iconUrl: '/assets/achievements/points_500.png',
    color: '#CD7F32',
    milestoneType: 'point_threshold',
    milestoneThreshold: 500,
    sortOrder: 11,
  },
  {
    key: 'points_5000',
    name: 'Points Titan',
    description: 'Earn a total of 5,000 points',
    tier: 'gold',
    category: 'milestone',
    pointsReward: 500,
    reputationReward: 50,
    iconUrl: '/assets/achievements/points_5000.png',
    color: '#FFD700',
    milestoneType: 'point_threshold',
    milestoneThreshold: 5000,
    sortOrder: 12,
  },
  {
    key: 'top_10_rank',
    name: 'Elite Contender',
    description: 'Reach top 10 on any leaderboard',
    tier: 'platinum',
    category: 'milestone',
    pointsReward: 500,
    reputationReward: 100,
    iconUrl: '/assets/achievements/top_10.png',
    color: '#E5E4E2',
    milestoneType: 'rank_position',
    milestoneThreshold: 10,
    sortOrder: 13,
  },
  {
    key: 'reputation_500',
    name: 'Trusted Voice',
    description: 'Reach 500 reputation score',
    tier: 'silver',
    category: 'milestone',
    pointsReward: 200,
    reputationReward: 25,
    iconUrl: '/assets/achievements/reputation_500.png',
    color: '#C0C0C0',
    milestoneType: 'reputation_threshold',
    milestoneThreshold: 500,
    sortOrder: 14,
  },

  // ── Streak Achievements ──
  {
    key: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day activity streak',
    tier: 'bronze',
    category: 'engagement',
    pointsReward: 50,
    reputationReward: 5,
    iconUrl: '/assets/achievements/streak_7.png',
    color: '#CD7F32',
    milestoneType: 'streak_days',
    milestoneThreshold: 7,
    sortOrder: 15,
  },
  {
    key: 'streak_30',
    name: 'Iron Will',
    description: 'Maintain a 30-day activity streak',
    tier: 'silver',
    category: 'engagement',
    pointsReward: 200,
    reputationReward: 30,
    iconUrl: '/assets/achievements/streak_30.png',
    color: '#C0C0C0',
    milestoneType: 'streak_days',
    milestoneThreshold: 30,
    sortOrder: 16,
  },
  {
    key: 'streak_100',
    name: 'Relentless',
    description: 'Maintain a 100-day activity streak',
    tier: 'legendary',
    category: 'engagement',
    pointsReward: 1000,
    reputationReward: 200,
    iconUrl: '/assets/achievements/streak_100.png',
    color: '#B967FF',
    milestoneType: 'streak_days',
    milestoneThreshold: 100,
    sortOrder: 17,
  },

  // ── Event Achievements ──
  {
    key: 'hackathon_winner',
    name: 'Hackathon Champion',
    description: 'Win your first hackathon',
    tier: 'gold',
    category: 'innovation',
    pointsReward: 500,
    reputationReward: 100,
    iconUrl: '/assets/achievements/hackathon_winner.png',
    color: '#FFD700',
    milestoneType: 'hackathon_count',
    milestoneThreshold: 1,
    sortOrder: 18,
  },
  {
    key: 'event_enthusiast',
    name: 'Event Enthusiast',
    description: 'Attend 10 campus events',
    tier: 'silver',
    category: 'community',
    pointsReward: 200,
    reputationReward: 25,
    iconUrl: '/assets/achievements/event_enthusiast.png',
    color: '#C0C0C0',
    milestoneType: 'event_count',
    milestoneThreshold: 10,
    sortOrder: 19,
  },

  // ── Social Achievements ──
  {
    key: 'influencer',
    name: 'Campus Influencer',
    description: 'Gain 100 followers',
    tier: 'gold',
    category: 'community',
    pointsReward: 300,
    reputationReward: 50,
    iconUrl: '/assets/achievements/influencer.png',
    color: '#FFD700',
    milestoneType: 'follower_count',
    milestoneThreshold: 100,
    sortOrder: 20,
  },
];

// ═══════════════════════════════════════════════════════
//  REWARDS — Available for point redemption
// ═══════════════════════════════════════════════════════

const defaultRewards = [
  {
    name: 'Custom Profile Badge',
    description: 'Unlock a custom profile badge for 500 points',
    pointsCost: 500,
    category: 'cosmetic',
    isActive: true,
  },
  {
    name: 'Priority Project Review',
    description: 'Get your project reviewed by mentors within 24 hours',
    pointsCost: 1000,
    category: 'benefit',
    isActive: true,
  },
  {
    name: 'Featured on Homepage',
    description: 'Get your project featured on the CampusX homepage for 1 week',
    pointsCost: 5000,
    category: 'benefit',
    isActive: true,
  },
  {
    name: 'Campus Hoodie',
    description: 'Redeem points for an exclusive CampusX hoodie',
    pointsCost: 10000,
    category: 'physical',
    isActive: true,
  },
  {
    name: 'Mock Interview Session',
    description: 'Get a 30-minute mock interview with an industry mentor',
    pointsCost: 3000,
    category: 'benefit',
    isActive: true,
  },
];

// ═══════════════════════════════════════════════════════
//  SEED EXECUTION
// ═══════════════════════════════════════════════════════

async function seedGamification() {
  try {
    await connectDatabase();
    console.log('✅ Connected to MongoDB.');

    // Seed Badges
    await Badge.deleteMany({});
    console.log('🧹 Cleared existing badges.');
    const seededBadges = await Badge.insertMany(defaultBadges);
    console.log(`🎖️  Seeded ${seededBadges.length} badges (${defaultBadges.filter(b => b.tier === 'legendary').length} legendary, ${defaultBadges.filter(b => b.tier === 'gold').length} gold, ${defaultBadges.filter(b => b.tier === 'silver').length} silver, ${defaultBadges.filter(b => b.tier === 'bronze').length} bronze).`);

    // Seed Achievements
    await Achievement.deleteMany({});
    console.log('🧹 Cleared existing achievements.');
    const seededAchievements = await Achievement.insertMany(defaultAchievements);
    console.log(`🏆  Seeded ${seededAchievements.length} achievements across ${new Set(defaultAchievements.map(a => a.category)).size} categories.`);

    // Seed Rewards
    await Reward.deleteMany({});
    console.log('🧹 Cleared existing rewards.');
    const seededRewards = await Reward.insertMany(defaultRewards);
    console.log(`🎁  Seeded ${seededRewards.length} rewards.`);

    // ── Summary ──
    console.log('\n═══════════════════════════════════════════');
    console.log('  GAMIFICATION SEED SUMMARY');
    console.log('═══════════════════════════════════════════');
    console.log(`  Badges:       ${seededBadges.length}`);
    console.log(`  Achievements: ${seededAchievements.length}`);
    console.log(`  Rewards:      ${seededRewards.length}`);
    console.log('═══════════════════════════════════════════');
    console.log('✅ Seeding completed successfully!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedGamification();
