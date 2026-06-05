const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { registerValidation, loginValidation } = require('../validators/authValidators');
const { authenticate } = require('../middleware/authenticate');
const { authLimiter } = require('../middleware/rateLimiter');

// POST /api/auth/register
router.post('/register', authLimiter, registerValidation, AuthController.register);

// POST /api/auth/login
router.post('/login', authLimiter, loginValidation, AuthController.login);

// POST /api/auth/refresh-token
router.post('/refresh-token', AuthController.refreshToken);

// POST /api/auth/logout (requires auth)
router.post('/logout', authenticate, AuthController.logout);

// POST /api/auth/logout-all (requires auth)
router.post('/logout-all', authenticate, AuthController.logoutAll);

module.exports = router;
