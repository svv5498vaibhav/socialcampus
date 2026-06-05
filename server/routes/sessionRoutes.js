const express = require('express');
const router = express.Router();
const SessionController = require('../controllers/sessionController');
const { authenticate } = require('../middleware/authenticate');

// GET /api/security/sessions
router.get('/', authenticate, SessionController.getActiveSessions);

// DELETE /api/security/sessions/:id
router.delete('/:id', authenticate, SessionController.revokeSession);

module.exports = router;
