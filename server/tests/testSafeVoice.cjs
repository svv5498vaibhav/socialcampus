/**
 * Test Suite for SafeVoice AI Module
 * Validates AI Moderation Heuristics, Identity Masking, Spam Similarity Filters, Reporting, and Escalations
 *
 * Run: node tests/testSafeVoice.cjs (from server directory)
 */
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
const connectDatabase = require('../config/database');

// Models
const AnonymousPost = require('../models/AnonymousPost');
const Report = require('../models/Report');
const ModerationLog = require('../models/ModerationLog');
const CommunityHealthMetrics = require('../models/CommunityHealthMetrics');
const Escalation = require('../models/Escalation');
const TrustSafetyLog = require('../models/TrustSafetyLog');

// Services
const AnonymousService = require('../services/anonymousService');
const ToxicityEngine = require('../services/toxicityEngine');
const SentimentEngine = require('../services/sentimentEngine');
const SpamEngine = require('../services/spamEngine');
const CategoryEngine = require('../services/categoryEngine');
const PriorityEngine = require('../services/priorityEngine');
const CommunityHealthEngine = require('../services/communityHealthEngine');

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

    const testUserId = new mongoose.Types.ObjectId();
    const testUserId2 = new mongoose.Types.ObjectId();
    const adminUserId = new mongoose.Types.ObjectId();

    // Clean initial tables
    await AnonymousPost.deleteMany({});
    await Report.deleteMany({});
    await ModerationLog.deleteMany({});
    await Escalation.deleteMany({});
    await TrustSafetyLog.deleteMany({});
    await CommunityHealthMetrics.deleteMany({});

    console.log('═══ TEST 1: Heuristic AI Engines ═══');
    
    // Toxicity Engine Checks
    const safeText = 'Hello, can anyone suggest a good place to study for exams?';
    const toxicText = 'You are a retard and a failure. Go die.';
    const flagText = 'This lecture is total shit. The professor is a moron.';

    const safeEval = ToxicityEngine.evaluate(safeText);
    const toxicEval = ToxicityEngine.evaluate(toxicText);
    const flagEval = ToxicityEngine.evaluate(flagText);

    assert(safeEval.status === 'safe' && safeEval.flags.length === 0, 'ToxicityEngine marks clean text as safe');
    assert(toxicEval.status === 'blocked' && toxicEval.flags.includes('hate_speech') && toxicEval.flags.includes('harassment'), 'ToxicityEngine blocks severe slurs and self-harm recommendations');
    assert(flagEval.status === 'review_required' && flagEval.flags.includes('profanity') && flagEval.flags.includes('personal_attack'), 'ToxicityEngine flags minor insults and profanity for review');

    // Sentiment Engine Scans
    const posText = 'I really appreciate the quick response from our college HOD. Excellent work!';
    const negText = 'The Wi-Fi in the hostel is terribly slow and broken. Disappointed.';
    
    const posSentiment = SentimentEngine.analyze(posText);
    const negSentiment = SentimentEngine.analyze(negText);

    assert(posSentiment.sentiment === 'positive' && posSentiment.score > 0, 'SentimentEngine detects positive statement polarity');
    assert(negSentiment.sentiment === 'negative' && negSentiment.score < 0, 'SentimentEngine detects negative statement polarity');

    // Category Engine Mapping
    const infraText = 'The power cut has damaged the elevator in Block A.';
    const acadText = 'The marks distribution syllabus for the upcoming credit course.';
    const hostText = 'The hostel mess food curfew timings.';

    assert(CategoryEngine.classify(infraText) === 'infrastructure', 'CategoryEngine classifies infrastructure keywords');
    assert(CategoryEngine.classify(acadText) === 'academics', 'CategoryEngine classifies academics keywords');
    assert(CategoryEngine.classify(hostText) === 'hostel', 'CategoryEngine classifies hostel keywords');

    // Priority Engine Assessment
    const criticalThreatText = 'I am going to jump off the building. Suicide is my only way out.';
    const normalText = 'We need clean water filters installed in the library reading room.';

    const critAssessment = PriorityEngine.assess(criticalThreatText, 'complaint');
    const normAssessment = PriorityEngine.assess(normalText, 'suggestion');

    assert(critAssessment.priority === 'critical' && critAssessment.escalation.escalateTo === 'director', 'PriorityEngine routes mental health/suicide signs to director as critical priority');
    assert(normAssessment.priority === 'low', 'PriorityEngine defaults generic suggestions to low priority');
    console.log('');

    console.log('═══ TEST 2: Identity Masking & Cryptographic Hashing ═══');
    const hash1 = AnonymousService.getStudentHash(testUserId);
    const hash2 = AnonymousService.getStudentHash(testUserId);
    const hashDiff = AnonymousService.getStudentHash(testUserId2);

    assert(hash1 === hash2, 'Daily salt hash is consistent for the same user on the same day');
    assert(hash1 !== hashDiff, 'Hashes are unique between different users');
    assert(hash1.length === 64, 'HMAC-SHA256 hash length is exactly 64 characters (hex)');
    console.log('');

    console.log('═══ TEST 3: Submit Safe Anonymous Post ═══');
    const postSafeText = 'The computer equipment in the labs is terribly slow and broken. Delaying my credit assignment.';
    const safePost = await AnonymousService.createPost(testUserId, postSafeText, 'issue');

    assert(safePost._id !== undefined, 'Post document created in database');
    assert(safePost.hashedStudentId === hash1, 'Post links with cryptographically masked student ID hash');
    assert(safePost.category === 'labs', `AI auto-categorized post into labs (actual: ${safePost.category})`);
    assert(safePost.sentiment === 'negative', `AI auto-detected negative sentiment (actual: ${safePost.sentiment}, score: ${safePost.sentimentScore})`);
    assert(safePost.priority === 'medium', 'Defaulted to medium priority for complaints/issues');
    assert(safePost.moderationStatus === 'safe', 'Moderation status marked safe');
    assert(safePost.isViewable === true, 'Safe post is viewable in feed');
    console.log('');

    console.log('═══ TEST 4: Submit Toxic Blocked Post ═══');
    const postToxicText = 'Go die. Hang yourself you absolute retard.';
    try {
      await AnonymousService.createPost(testUserId, postToxicText, 'complaint');
      assert(false, 'Should throw error for auto-blocked toxic content');
    } catch (err) {
      console.log('    Actual Error thrown:', err.message);
      assert(err.message.toLowerCase().includes('blocked'), 'Toxicity check triggers blocked exception');
    }

    const blockedPost = await AnonymousPost.findOne({ content: postToxicText });
    assert(blockedPost !== null, 'Blocked post still saved for audit trail');
    assert(blockedPost.moderationStatus === 'blocked', 'Moderation status recorded as blocked');
    assert(blockedPost.isViewable === false, 'Blocked post is hidden from feed');

    const modLog = await ModerationLog.findOne({ postId: blockedPost._id });
    assert(modLog && modLog.action === 'blocked' && modLog.decisionSource === 'auto_moderator', 'Moderation audit log auto-saved');
    console.log('');

    console.log('═══ TEST 5: Duplicate Post Spam Similarity Filter ═══');
    const duplicateText = 'The computer equipment in the labs is terribly slow and broken. Delaying my credit assignment.';
    try {
      await AnonymousService.createPost(testUserId2, duplicateText, 'issue');
      assert(false, 'Should throw error for duplicate spam content');
    } catch (err) {
      assert(err.message.includes('matches a recent submission'), 'Duplicate/near-duplicate content blocked under spam filter');
    }
    console.log('');

    console.log('═══ TEST 6: Auto-Escalation Critical Risk Routing ═══');
    const selfHarmText = 'Feeling very depressed and hopeless. Suicide seems like my only option.';
    const critPost = await AnonymousService.createPost(testUserId, selfHarmText, 'complaint');

    assert(critPost.priority === 'critical', 'Post marked critical priority');
    
    const escalation = await Escalation.findOne({ postId: critPost._id });
    assert(escalation && escalation.status === 'pending' && escalation.escalatedTo === 'director', 'Escalation record generated for critical issue and routed to director');

    const critModLog = await ModerationLog.findOne({ postId: critPost._id, action: 'escalated' });
    assert(critModLog !== null, 'Escalation recorded in moderation history log');
    console.log('');

    console.log('═══ TEST 7: Student Reporting Flow ═══');
    const reporterHash = AnonymousService.getStudentHash(testUserId2);
    const reportObj = await AnonymousService.reportPost(testUserId2, safePost._id, 'offensive', 'Contains abusive terms');

    assert(reportObj.postId.toString() === safePost._id.toString(), 'Report links to the post');
    assert(reportObj.reporterHash === reporterHash, 'Reporter identity cryptographically masked in report');
    
    const refetchedPost = await AnonymousPost.findById(safePost._id);
    assert(refetchedPost.reportsCount === 1, 'Post reportsCount incremented');

    // Duplicate report prevention check
    try {
      await AnonymousService.reportPost(testUserId2, safePost._id, 'spam');
      assert(false, 'Should block duplicate flag from same user hash');
    } catch (err) {
      assert(err.message.includes('already reported'), 'Duplicate reporting blocked');
    }
    console.log('');

    console.log('═══ TEST 8: Admin Manual Moderation Override ═══');
    const adminAction = await AnonymousService.moderatePost(safePost._id, adminUserId, 'blocked', 'Violates community standards');
    assert(adminAction.moderationStatus === 'blocked' && adminAction.isViewable === false, 'Admin override blocks the post and hides it from view');

    const adminModLog = await ModerationLog.findOne({ postId: safePost._id, action: 'blocked', decisionSource: 'admin_manual' });
    assert(adminModLog !== null, 'Manual admin action audited in ModerationLogs');

    const resolvedReports = await Report.find({ postId: safePost._id });
    assert(resolvedReports.every(r => r.status === 'resolved'), 'Open reports for the blocked post auto-marked as resolved');
    console.log('');

    console.log('═══ TEST 9: Community Health Metric Calculation ═══');
    const todayStr = new Date().toISOString().split('T')[0];
    const metrics = await CommunityHealthEngine.calculateHealthScore(todayStr);

    assert(metrics.date === todayStr, 'Metrics generated for today');
    assert(metrics.totalPosts === 3, `Counts total posts logged today (actual: ${metrics.totalPosts})`);
    assert(metrics.blockedPosts === 2, 'Counts blocked posts logged today');
    assert(metrics.healthScore < 100, 'Health score index reflects blocked ratios');
    console.log('');

    console.log('═══ CLEANUP ═══');
    await AnonymousPost.deleteMany({});
    await Report.deleteMany({});
    await ModerationLog.deleteMany({});
    await Escalation.deleteMany({});
    await TrustSafetyLog.deleteMany({});
    await CommunityHealthMetrics.deleteMany({});
    console.log('  🧹 Cleaned up test data.');
    console.log('');

    console.log('═══════════════════════════════════════════');
    console.log('  SAFEVOICE AI SYSTEM TEST RESULTS');
    console.log('═══════════════════════════════════════════');
    console.log(`  Ref Engine Scans:   ${10}`);
    console.log(`  ✅ Passed: ${passed}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  Total:   ${passed + failed}`);
    console.log('═══════════════════════════════════════════');

    if (failed > 0) {
      console.log('\n⚠️  Some tests failed. Review the output above.\n');
      process.exit(1);
    } else {
      console.log('\n🎉 All SafeVoice AI tests passed!\n');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Test runner crashed:', error);
    process.exit(1);
  }
}

runTests();
