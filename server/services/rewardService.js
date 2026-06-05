const Reward = require('../models/Reward');
const UserReward = require('../models/UserReward');
const RewardTransaction = require('../models/RewardTransaction');
const UserPoint = require('../models/UserPoint');
const PointsLog = require('../models/PointsLog');
const { createAndSendNotification, getIO } = require('./socketService');

class RewardService {
  /**
   * Get all active rewards
   */
  static async getActiveRewards() {
    return await Reward.find({ isActive: true }).sort({ pointsCost: 1 }).lean();
  }

  /**
   * Redeem a reward
   * Atomic operations to deduct points and check stock
   */
  static async redeemReward(userId, rewardId, ipAddress = null) {
    // 1. Fetch reward details
    const reward = await Reward.findById(rewardId);
    if (!reward) {
      throw new Error('Reward not found');
    }

    if (!reward.isActive) {
      throw new Error('This reward is currently inactive');
    }

    if (reward.stock === 0) {
      throw new Error('This reward is out of stock');
    }

    // 2. Fetch user points balance
    const userPoint = await UserPoint.findOne({ userId });
    if (!userPoint) {
      throw new Error('User points profile not found');
    }

    if (userPoint.currentPoints < reward.pointsCost) {
      throw new Error(`Insufficient points balance. Need ${reward.pointsCost} points, but you have ${userPoint.currentPoints}.`);
    }

    // 3. Atomically update user points (decrement spendable currentPoints, leave lifetimePoints unchanged)
    const originalPoints = userPoint.currentPoints;
    const newPoints = originalPoints - reward.pointsCost;

    // Use findOneAndUpdate with filter to prevent race conditions on balance checks
    const updatedUserPoint = await UserPoint.findOneAndUpdate(
      { userId, currentPoints: { $gte: reward.pointsCost } },
      { $inc: { currentPoints: -reward.pointsCost } },
      { new: true }
    );

    if (!updatedUserPoint) {
      throw new Error('Failed to redeem reward due to concurrent point changes. Please try again.');
    }

    // 4. Update Stock (if not unlimited)
    if (reward.stock > 0) {
      const updatedReward = await Reward.findOneAndUpdate(
        { _id: rewardId, stock: { $gt: 0 } },
        { $inc: { stock: -1 } },
        { new: true }
      );

      if (!updatedReward) {
        // Rollback user points update since stock allocation failed
        await UserPoint.findOneAndUpdate({ userId }, { $inc: { currentPoints: reward.pointsCost } });
        throw new Error('Failed to secure reward stock. It might have just sold out.');
      }
    }

    // 5. Create transaction ledger
    const transaction = await RewardTransaction.create({
      userId,
      rewardId,
      pointsSpent: reward.pointsCost,
      pointsBalanceBefore: originalPoints,
      pointsBalanceAfter: newPoints,
      status: reward.category === 'digital' || reward.category === 'cosmetic' ? 'fulfilled' : 'pending',
      ipAddress,
    });

    // 6. Add reward to user's inventory
    const userReward = await UserReward.create({
      userId,
      rewardId,
      status: transaction.status === 'fulfilled' ? 'delivered' : 'claimed',
      redeemedAt: new Date(),
    });

    // 7. Write points log action
    await PointsLog.create({
      userId,
      actionType: 'admin_adjustment', // Log as deduction/adjustment
      pointsEarned: -reward.pointsCost,
      sourceId: transaction._id,
      metadata: {
        rewardId,
        rewardName: reward.name,
        type: 'redemption',
      },
    });

    // 8. Deliver Socket real-time HUD event & System Notification
    try {
      const io = getIO();
      io.to(`user:${userId}`).emit('points-update', {
        currentPoints: updatedUserPoint.currentPoints,
        lifetimePoints: updatedUserPoint.lifetimePoints,
        change: -reward.pointsCost,
        reason: 'reward_redeemed',
      });

      io.to(`user:${userId}`).emit('reward-redeemed', {
        transactionId: transaction._id,
        rewardId: reward._id,
        name: reward.name,
        pointsSpent: reward.pointsCost,
      });

      await createAndSendNotification(
        userId,
        null,
        'achievement',
        null,
        `Reward Claimed: ${reward.name}!`,
        `Successfully redeemed ${reward.pointsCost} points for ${reward.name}.`
      );
    } catch (err) {
      console.warn('Real-time notification failed for reward redemption:', err.message);
    }

    return {
      success: true,
      transaction,
      userReward,
      remainingPoints: updatedUserPoint.currentPoints,
    };
  }

  /**
   * Fulfill a pending reward transaction (Admin/Moderator action)
   */
  static async fulfillTransaction(transactionId, adminUserId, notes = '') {
    const transaction = await RewardTransaction.findById(transactionId);
    if (!transaction) {
      throw new Error('Reward transaction not found');
    }

    if (transaction.status !== 'pending' && transaction.status !== 'processing') {
      throw new Error(`Transaction cannot be fulfilled from status: ${transaction.status}`);
    }

    transaction.status = 'fulfilled';
    transaction.fulfilledBy = adminUserId;
    transaction.fulfilledAt = new Date();
    transaction.fulfillmentNotes = notes;
    await transaction.save();

    // Update UserReward inventory status
    await UserReward.findOneAndUpdate(
      { userId: transaction.userId, rewardId: transaction.rewardId },
      { status: 'delivered' }
    );

    // Send Notification to user
    try {
      const reward = await Reward.findById(transaction.rewardId).select('name');
      await createAndSendNotification(
        transaction.userId,
        adminUserId,
        'achievement',
        null,
        `Reward Fulfilled: ${reward?.name || 'Your reward'}`,
        `Your redeemed reward has been fulfilled by the CampusX team. Notes: ${notes}`
      );
    } catch (err) {
      console.warn('Fulfillment notification failed:', err.message);
    }

    return transaction;
  }

  /**
   * Reject & Refund a reward transaction (Admin action)
   */
  static async refundTransaction(transactionId, adminUserId, refundReason = '') {
    const transaction = await RewardTransaction.findById(transactionId);
    if (!transaction) {
      throw new Error('Reward transaction not found');
    }

    if (transaction.status === 'refunded' || transaction.status === 'rejected') {
      throw new Error('Transaction is already refunded or rejected');
    }

    // Capture state
    const pointsToRefund = transaction.pointsSpent;

    // Refund points to user
    const userPoint = await UserPoint.findOneAndUpdate(
      { userId: transaction.userId },
      { $inc: { currentPoints: pointsToRefund } },
      { new: true }
    );

    if (!userPoint) {
      throw new Error('Target user point profile not found');
    }

    // Update stock if not unlimited
    const reward = await Reward.findById(transaction.rewardId);
    if (reward && reward.stock !== -1) {
      reward.stock += 1;
      await reward.save();
    }

    // Log the refund points back
    await PointsLog.create({
      userId: transaction.userId,
      actionType: 'admin_adjustment',
      pointsEarned: pointsToRefund,
      sourceId: transaction._id,
      metadata: {
        refundedTransactionId: transactionId,
        reason: refundReason,
        type: 'refund',
      },
    });

    // Update transaction state
    transaction.status = 'refunded';
    transaction.refundedAt = new Date();
    transaction.refundReason = refundReason;
    transaction.fulfilledBy = adminUserId;
    await transaction.save();

    // Delete or update the inventory record
    await UserReward.deleteOne({ userId: transaction.userId, rewardId: transaction.rewardId });

    // Notify User
    try {
      const io = getIO();
      io.to(`user:${transaction.userId}`).emit('points-update', {
        currentPoints: userPoint.currentPoints,
        lifetimePoints: userPoint.lifetimePoints,
        change: pointsToRefund,
        reason: 'reward_refunded',
      });

      await createAndSendNotification(
        transaction.userId,
        adminUserId,
        'achievement',
        null,
        `Reward Refunded: ${reward?.name || 'Your reward'}`,
        `Your redemption was rejected and refunded. Reason: ${refundReason}. ${pointsToRefund} points returned.`
      );

    } catch (err) {
      console.warn('Refund notification failed:', err.message);
    }

    return transaction;
  }
}

module.exports = RewardService;
