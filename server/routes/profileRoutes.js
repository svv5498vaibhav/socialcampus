const express = require('express');
const router = express.Router();
const ProfileController = require('../controllers/profileController');
const { authenticate } = require('../middleware/authenticate');

// GET /api/profile
router.get('/', authenticate, ProfileController.getProfile);

module.exports = router;
