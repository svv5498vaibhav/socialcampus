const { body } = require('express-validator');

const onboardingStepValidation = [
  body('college').optional().trim().notEmpty().withMessage('College name is required'),
  body('branch').optional().trim().notEmpty().withMessage('Branch is required'),
  body('semester').optional().isInt({ min: 1, max: 12 }).withMessage('Semester must be between 1 and 12'),
  body('username').optional().trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters')
    .matches(/^[a-z0-9_]+$/).withMessage('Username: lowercase letters, numbers, underscores only'),
  body('bio').optional().trim().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
  body('avatarUrl').optional().trim(),
  body('interests').optional().isArray({ max: 20 }).withMessage('Interests must be an array (max 20)'),
  body('interests.*').optional().isString().trim(),
  body('skills').optional().isArray({ max: 30 }).withMessage('Skills must be an array (max 30)'),
  body('skills.*').optional().isString().trim(),
  body('careerGoals').optional().isArray({ max: 5 }).withMessage('Career goals must be an array (max 5)'),
  body('careerGoals.*').optional().isString().trim(),
];

const profileUpdateValidation = [
  body('username').optional().trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters')
    .matches(/^[a-z0-9_]+$/).withMessage('Username: lowercase letters, numbers, underscores only'),
  body('bio').optional().trim().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
  body('avatarUrl').optional().trim(),
  body('skills').optional().isArray({ max: 30 }),
  body('interests').optional().isArray({ max: 20 }),
  body('careerGoals').optional().isArray({ max: 5 }),
  body('preferredDomains').optional().isArray({ max: 10 }),
  body('internshipInterests').optional().isArray({ max: 10 }),
  body('higherEducationGoals').optional().isIn(['MS Abroad', 'MBA', 'MTech India', 'PhD', 'Job after BTech', 'Entrepreneurship', 'Undecided', '']),
  body('projects').optional().isArray({ max: 20 }),
  body('projects.*.title').optional().trim().isLength({ min: 1, max: 100 }),
  body('projects.*.description').optional().trim().isLength({ max: 500 }),
  body('certifications').optional().isArray({ max: 20 }),
  body('certifications.*.title').optional().trim().isLength({ min: 1, max: 100 }),
  body('achievements').optional().isArray({ max: 20 }),
  body('achievements.*.title').optional().trim().isLength({ min: 1, max: 100 }),
];

module.exports = { onboardingStepValidation, profileUpdateValidation };
