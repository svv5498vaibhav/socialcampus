const { body } = require('express-validator');
const mongoose = require('mongoose');

const validateMongoId = (value) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error('Invalid ID format');
  }
  return true;
};

const publishProjectValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Project title is required')
    .isLength({ max: 150 }).withMessage('Title cannot exceed 150 characters'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  body('techStack')
    .isArray({ min: 1 }).withMessage('At least one technology must be specified'),
  body('githubLink')
    .optional({ checkFalsy: true })
    .isURL().withMessage('Invalid GitHub link format'),
  body('demoLink')
    .optional({ checkFalsy: true })
    .isURL().withMessage('Invalid demo link format'),
  body('videoUrl')
    .optional({ checkFalsy: true })
    .isURL().withMessage('Invalid video demo link format'),
  body('screenshotUrls')
    .optional()
    .isArray().withMessage('Screenshots must be an array of image links'),
  body('documentation')
    .optional()
    .trim(),
];

const publishContentPostValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('content')
    .trim()
    .notEmpty().withMessage('Content is required')
    .isLength({ max: 10000 }).withMessage('Content cannot exceed 10000 characters'),
  body('type')
    .isIn(['project', 'resource', 'achievement', 'internship', 'event', 'blog', 'discussion'])
    .withMessage('Invalid content post type'),
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array'),
  body('category')
    .optional()
    .trim(),
];

const uploadResourceValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Resource title is required')
    .isLength({ max: 150 }).withMessage('Title cannot exceed 150 characters'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  body('type')
    .isIn(['pdf', 'notes', 'link', 'paper', 'roadmap', 'study_material'])
    .withMessage('Invalid resource type'),
  body('url')
    .trim()
    .notEmpty().withMessage('Resource access URL/link is required'),
  body('category')
    .optional()
    .trim(),
];

const trackEngagementValidation = [
  body('postId')
    .custom(validateMongoId).withMessage('Invalid post ID format'),
  body('views')
    .optional()
    .isInt({ min: 0 }).withMessage('views count must be positive'),
  body('clicks')
    .optional()
    .isInt({ min: 0 }).withMessage('clicks count must be positive'),
  body('readingDurationMs')
    .optional()
    .isInt({ min: 0 }).withMessage('duration must be a positive number'),
  body('scrollDepthPercent')
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage('scrollDepth must be between 0 and 100'),
];

module.exports = {
  publishProjectValidation,
  publishContentPostValidation,
  uploadResourceValidation,
  trackEngagementValidation,
};
