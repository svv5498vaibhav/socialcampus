const { body, param, query } = require('express-validator');
const mongoose = require('mongoose');

const validateMongoId = (value) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error('Invalid resource ID format');
  }
  return true;
};

const postCreateValidation = [
  body('title').optional().trim().isLength({ max: 150 }).withMessage('Title cannot exceed 150 characters'),
  body('content')
    .trim()
    .notEmpty().withMessage('Content is required')
    .isLength({ min: 5, max: 10000 }).withMessage('Content must be between 5 and 10,000 characters'),
  body('mediaUrls').optional().isArray().withMessage('mediaUrls must be an array'),
  body('mediaUrls.*').optional().trim().isURL().withMessage('Each media URL must be a valid link'),
  body('metadata').optional().isObject().withMessage('metadata must be an object'),
];

const commentCreateValidation = [
  body('postId').custom(validateMongoId),
  body('content')
    .trim()
    .notEmpty().withMessage('Comment content is required')
    .isLength({ max: 1000 }).withMessage('Comment cannot exceed 1000 characters'),
];

const engagementValidation = [
  body('postId').custom(validateMongoId),
];

const viewTrackValidation = [
  body('postId').custom(validateMongoId),
  body('watchTime').optional().isFloat({ min: 0 }).withMessage('Watch time must be a non-negative number'),
];

const reportPostValidation = [
  body('postId').custom(validateMongoId),
  body('reason')
    .trim()
    .notEmpty().withMessage('Reason for report is required')
    .isLength({ min: 3, max: 200 }).withMessage('Reason must be between 3 and 200 characters'),
];

module.exports = {
  postCreateValidation,
  commentCreateValidation,
  engagementValidation,
  viewTrackValidation,
  reportPostValidation
};
