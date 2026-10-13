const express = require('express');
const reminderController = require('../controllers/reminderController');
const { validateUpdateReminder } = require('../validators/reminderValidator');
const authenticate = require('../middleware/authMiddleware');

const router = express.Router();

// All reminder endpoints require authentication
router.use(authenticate);

// GET /api/reminders - Fetch current user's reminder configuration
router.get('/', reminderController.getReminder);

// PUT /api/reminders - Update current user's reminder configuration
router.put('/', validateUpdateReminder, reminderController.updateReminder);

module.exports = router;
