const express = require('express');
const router = express.Router();
const SecurityController = require('../controllers/securityController');
const { authenticate } = require('../middleware/authenticate');

// GET /api/security/status
router.get('/status', authenticate, SecurityController.getSecurityStatus);

// GET /api/security/login-history
router.get('/login-history', authenticate, SecurityController.getLoginHistory);

// GET /api/security/trust-score
router.get('/trust-score', authenticate, SecurityController.getTrustScore);

module.exports = router;
