const express = require('express');
const exportController = require('../controllers/exportController');
const authenticate = require('../middleware/authMiddleware');

const router = express.Router();

// Require authentication for all export operations
router.use(authenticate);

// GET /api/export/json - Export user's mood entries as JSON file
router.get('/json', exportController.exportJson);

// GET /api/export/csv - Export user's mood entries as CSV file
router.get('/csv', exportController.exportCsv);

module.exports = router;
