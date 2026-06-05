/**
 * Test Suite for RankForge AI Phase 3 - Reward System & Engine
 * Run: node server/tests/testPhase3Rewards.cjs
 */
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
const connectDatabase = require('../config/database');

// Models
const Reward = require('../models/Reward');
const UserPoint = require('../models/UserPoint');
const RewardTransaction = require('../models/RewardTransaction');
const UserReward = require('../models/UserReward');
const PointsLog = require('../models/PointsLog');

// Service
const rewardService = require('../services/rewardService');

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
    const adminUserId = new mongoose.Types.ObjectId();

    // 1. Setup a Test User Profile with points
    const userPoint = new UserPoint({
      userId: testUserId,
      currentPoints: 2000,
      lifetimePoints: 2000,
      college: 'Test College',
      branch: 'CS',
      semester: '1st',
    });
    await userPoint.save();

    // 2. Setup active reward items
    const rewardDigital = new Reward({
      name: 'Digital Certificate',
      description: 'A certificate for completing tests',
      pointsCost: 500,
      category: 'digital',
      stock: -1, // Unlimited
      isActive: true,
    });
    await rewardDigital.save();

    const rewardPhysical = new Reward({
      name: 'Campus T-Shirt',
      description: 'Physical apparel item',
      pointsCost: 1000,
      category: 'physical',
      stock: 10,
      isActive: true,
    });
    await rewardPhysical.save();

    const rewardOutofStock = new Reward({
      name: 'Mentorship Session',
      description: '1-on-1 sessions',
      pointsCost: 800,
      category: 'benefit',
      stock: 0,
      isActive: true,
    });
    await rewardOutofStock.save();

    const rewardRefundable = new Reward({
      name: 'Refundable Certificate',
      description: 'Used only for testing refunds',
      pointsCost: 500,
      category: 'digital',
      stock: -1,
      isActive: true,
    });
    await rewardRefundable.save();

    console.log('═══ TEST 1: Retrieve Active Rewards ═══');
    const activeRewards = await rewardService.getActiveRewards();
    assert(activeRewards.length >= 3, 'Should fetch active rewards');
    assert(activeRewards.some(r => r.name === 'Digital Certificate'), 'Digital Certificate in active list');
    assert(activeRewards.some(r => r.name === 'Campus T-Shirt'), 'Campus T-Shirt in active list');
    console.log('');

    console.log('═══ TEST 2: Redeem Digital Reward (Auto-Fulfilled) ═══');
    const digitalRes = await rewardService.redeemReward(testUserId, rewardDigital._id, '127.0.0.1');
    assert(digitalRes.success === true, 'Redeem should succeed');
    assert(digitalRes.remainingPoints === 1500, 'Current points decremented from 2000 to 1500');
    assert(digitalRes.transaction.status === 'fulfilled', 'Digital rewards are auto-fulfilled');
    assert(digitalRes.userReward.status === 'delivered', 'UserReward status marked delivered');
    
    // Check points log has negative value
    const log1 = await PointsLog.findOne({ sourceId: digitalRes.transaction._id });
    assert(log1 && log1.pointsEarned === -500, 'PointsLog entry created with negative pointsCost');
    console.log('');

    console.log('═══ TEST 3: Redeem Out of Stock Reward ═══');
    try {
      await rewardService.redeemReward(testUserId, rewardOutofStock._id);
      assert(false, 'Should throw error for out of stock');
    } catch (err) {
      assert(err.message === 'This reward is out of stock', 'Proper error message for out of stock');
    }
    console.log('');

    console.log('═══ TEST 4: Redeem Physical Reward (Pending Fulfill) ═══');
    const physicalRes = await rewardService.redeemReward(testUserId, rewardPhysical._id, '127.0.0.1');
    assert(physicalRes.success === true, 'Redemption of physical reward succeeds');
    assert(physicalRes.remainingPoints === 500, 'Points decremented to 500');
    assert(physicalRes.transaction.status === 'pending', 'Physical rewards default to pending');
    assert(physicalRes.userReward.status === 'claimed', 'UserReward status defaults to claimed');

    // Check stock decremented
    const refetchedPhysicalReward = await Reward.findById(rewardPhysical._id);
    assert(refetchedPhysicalReward.stock === 9, 'Stock decremented from 10 to 9');
    console.log('');

    console.log('═══ TEST 5: Insufficient Points Check ═══');
    try {
      await rewardService.redeemReward(testUserId, rewardPhysical._id);
      assert(false, 'Should throw error for insufficient points');
    } catch (err) {
      assert(err.message.includes('Insufficient points balance'), 'Proper error message for insufficient points');
    }
    console.log('');

    console.log('═══ TEST 6: Admin Fulfill Pending Reward ═══');
    const fulfilledTx = await rewardService.fulfillTransaction(physicalRes.transaction._id, adminUserId, 'Shipped via courier');
    assert(fulfilledTx.status === 'fulfilled', 'Transaction marked as fulfilled');
    assert(fulfilledTx.fulfilledBy.toString() === adminUserId.toString(), 'fulfilledBy recorded');
    assert(fulfilledTx.fulfillmentNotes === 'Shipped via courier', 'notes recorded');

    const updatedUserReward = await UserReward.findOne({ userId: testUserId, rewardId: rewardPhysical._id });
    assert(updatedUserReward.status === 'delivered', 'UserReward status updated to delivered');
    console.log('');

    console.log('═══ TEST 7: Admin Reject & Refund Reward ═══');
    // Let's redeem refundable to test refund
    const redeemForRefund = await rewardService.redeemReward(testUserId, rewardRefundable._id);
    assert(redeemForRefund.remainingPoints === 0, 'Points down to 0');
    
    const refundedTx = await rewardService.refundTransaction(redeemForRefund.transaction._id, adminUserId, 'Defective product/issue');
    assert(refundedTx.status === 'refunded', 'Transaction marked as refunded');
    assert(refundedTx.refundReason === 'Defective product/issue', 'refundReason recorded');

    const refetchedUserPoint = await UserPoint.findOne({ userId: testUserId });
    assert(refetchedUserPoint.currentPoints === 500, 'Points refunded back to 500');

    const deletedUserReward = await UserReward.findOne({ userId: testUserId, rewardId: rewardRefundable._id });
    assert(deletedUserReward === null, 'UserReward record deleted after refund');
    console.log('');

    console.log('═══ CLEANUP ═══');
    await UserPoint.deleteOne({ userId: testUserId });
    await Reward.deleteMany({ _id: { $in: [rewardDigital._id, rewardPhysical._id, rewardOutofStock._id, rewardRefundable._id] } });
    await RewardTransaction.deleteMany({ userId: testUserId });
    await UserReward.deleteMany({ userId: testUserId });
    await PointsLog.deleteMany({ userId: testUserId });
    console.log('  🧹 Cleaned up test data.');
    console.log('');

    console.log('═══════════════════════════════════════════');
    console.log('  REWARD SYSTEM ENGINE TEST RESULTS');
    console.log('═══════════════════════════════════════════');
    console.log(`  ✅ Passed: ${passed}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  Total:   ${passed + failed}`);
    console.log('═══════════════════════════════════════════');

    if (failed > 0) {
      console.log('\n⚠️  Some tests failed. Review the output above.\n');
      process.exit(1);
    } else {
      console.log('\n🎉 All Reward System tests passed!\n');
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ Test runner crashed:', err);
    process.exit(1);
  }
}

runTests();
