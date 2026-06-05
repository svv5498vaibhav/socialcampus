const { body, query } = require('express-validator');
const mongoose = require('mongoose');

const validateMongoId = (value) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error('Invalid ID format');
  }
  return true;
};

const createPostValidation = [
  body('content')
    .trim()
    .notEmpty().withMessage('Content is required')
    .isLength({ min: 10, max: 1000 }).withMessage('Content must be between 10 and 1000 characters'),
  body('type')
    .isIn([
      'suggestion',
      'complaint',
      'issue',
      'academic_concern',
      'facility_concern',
      'faculty_feedback',
      'campus_improvement',
      'general_discussion',
    ])
    .withMessage('Invalid feedback type'),
];

const reportPostValidation = [
  body('postId').custom(validateMongoId).withMessage('Invalid post ID format'),
  body('reason')
    .isIn(['offensive', 'spam', 'abuse', 'harassment', 'fake_info'])
    .withMessage('Invalid report reason'),
  body('details')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Details must be at most 500 characters'),
];

const moderatePostValidation = [
  body('postId').custom(validateMongoId).withMessage('Invalid post ID format'),
  body('status')
    .isIn(['safe', 'blocked'])
    .withMessage("Moderation status must be 'safe' or 'blocked'"),
  body('reason')
    .trim()
    .notEmpty().withMessage('Reason is required')
    .isLength({ min: 3, max: 200 }).withMessage('Reason must be between 3 and 200 characters'),
];

const resolveEscalationValidation = [
  body('escalationId').custom(validateMongoId).withMessage('Invalid escalation ID format'),
  body('notes')
    .trim()
    .notEmpty().withMessage('Resolution notes are required')
    .isLength({ min: 3, max: 1000 }).withMessage('Notes must be between 3 and 1000 characters'),
];

module.exports = {
  createPostValidation,
  reportPostValidation,
  moderatePostValidation,
  resolveEscalationValidation,
};
