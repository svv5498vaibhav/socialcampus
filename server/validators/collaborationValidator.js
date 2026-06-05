const { body, param, query } = require('express-validator');
const mongoose = require('mongoose');

const validateMongoId = (value) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error('Invalid ID format');
  }
  return true;
};

const createCommunityValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Community name is required')
    .isLength({ min: 3, max: 100 }).withMessage('Name must be between 3 and 100 characters'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('type')
    .isIn(['branch', 'semester', 'technology', 'college', 'project'])
    .withMessage('Invalid community type'),
  body('topic')
    .trim()
    .notEmpty().withMessage('Topic is required'),
];

const createPostValidation = [
  body('content')
    .trim()
    .notEmpty().withMessage('Post content cannot be empty')
    .isLength({ max: 5000 }).withMessage('Content cannot exceed 5000 characters'),
  body('mediaUrls')
    .optional()
    .isArray().withMessage('Media URLs must be an array'),
];

const createEventValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Event title is required')
    .isLength({ max: 150 }).withMessage('Title cannot exceed 150 characters'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  body('type')
    .isIn(['workshop', 'hackathon', 'seminar', 'meetup', 'competition'])
    .withMessage('Invalid event type'),
  body('mode')
    .isIn(['online', 'offline'])
    .withMessage('Mode must be online or offline'),
  body('venueOrLink')
    .trim()
    .notEmpty().withMessage('Venue or meeting link is required'),
  body('startTime')
    .isISO8601().withMessage('Invalid start time format'),
  body('endTime')
    .isISO8601().withMessage('Invalid end time format'),
  body('registrationDeadline')
    .isISO8601().withMessage('Invalid registration deadline format'),
  body('maxParticipants')
    .optional()
    .isInt({ min: 0 }).withMessage('maxParticipants must be a positive integer'),
];

const requestMentorshipValidation = [
  body('mentorId')
    .custom(validateMongoId).withMessage('Invalid mentor ID format'),
  body('topic')
    .trim()
    .notEmpty().withMessage('Mentorship topic is required')
    .isLength({ max: 150 }).withMessage('Topic cannot exceed 150 characters'),
  body('goals')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Goals cannot exceed 500 characters'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Message cannot exceed 1000 characters'),
];

const createTeamValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Team name is required')
    .isLength({ max: 100 }).withMessage('Team name cannot exceed 100 characters'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  body('skillsRequired')
    .isArray({ min: 1 }).withMessage('At least one skill must be specified'),
  body('experienceLevel')
    .isIn(['beginner', 'intermediate', 'advanced', 'any'])
    .withMessage('Invalid experience level'),
  body('availability')
    .optional()
    .trim(),
];

module.exports = {
  createCommunityValidation,
  createPostValidation,
  createEventValidation,
  requestMentorshipValidation,
  createTeamValidation,
};
