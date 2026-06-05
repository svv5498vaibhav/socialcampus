const { body } = require('express-validator');

const updatePreferencesValidation = [
  body('likes')
    .optional()
    .isObject().withMessage('likes preference must be an object'),
  body('comments')
    .optional()
    .isObject().withMessage('comments preference must be an object'),
  body('mentions')
    .optional()
    .isObject().withMessage('mentions preference must be an object'),
  body('follows')
    .optional()
    .isObject().withMessage('follows preference must be an object'),
  body('invitations')
    .optional()
    .isObject().withMessage('invitations preference must be an object'),
  body('opportunities')
    .optional()
    .isObject().withMessage('opportunities preference must be an object'),
];

const trackActivityValidation = [
  body('action')
    .trim()
    .notEmpty().withMessage('Action type is required')
    .isIn(['post_created', 'project_uploaded', 'community_joined', 'resource_shared', 'event_attended', 'team_collaboration', 'learning_completed'])
    .withMessage('Invalid action type'),
  body('details')
    .optional()
    .isObject().withMessage('Details must be an object'),
];

const logSessionValidation = [
  body('durationMs')
    .optional()
    .isInt({ min: 0 }).withMessage('durationMs must be a positive integer'),
];

const updateInternshipStatusValidation = [
  body('status')
    .isIn(['active', 'applied', 'dismissed'])
    .withMessage("Opportunity match status must be 'active', 'applied', or 'dismissed'"),
];

module.exports = {
  updatePreferencesValidation,
  trackActivityValidation,
  logSessionValidation,
  updateInternshipStatusValidation,
};
