const { body, query } = require('express-validator');
const mongoose = require('mongoose');

const validateMongoId = (value) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error('Invalid ID format');
  }
  return true;
};

const getLeaderboardValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer starting at 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
];

const updatePointsValidation = [
  body('userId').custom(validateMongoId),
  body('points').isInt().withMessage('Points must be an integer (positive or negative)'),
  body('reason')
    .trim()
    .notEmpty().withMessage('Reason is required')
    .isLength({ min: 3, max: 100 }).withMessage('Reason must be between 3 and 100 characters'),
];

const getHistoryValidation = [
  query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365'),
];

const redeemRewardValidation = [
  body('rewardId')
    .custom(validateMongoId)
    .withMessage('Invalid Reward ID format'),
];

const fulfillRewardValidation = [
  body('transactionId')
    .custom(validateMongoId)
    .withMessage('Invalid Transaction ID format'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes must be at most 500 characters'),
];

const refundRewardValidation = [
  body('transactionId')
    .custom(validateMongoId)
    .withMessage('Invalid Transaction ID format'),
  body('reason')
    .trim()
    .notEmpty().withMessage('Refund reason is required')
    .isLength({ min: 3, max: 200 }).withMessage('Refund reason must be between 3 and 200 characters'),
];

module.exports = {
  getLeaderboardValidation,
  updatePointsValidation,
  getHistoryValidation,
  redeemRewardValidation,
  fulfillRewardValidation,
  refundRewardValidation,
};

