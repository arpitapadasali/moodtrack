const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const authenticate = require('../middleware/authMiddleware');
const {
  validateTrendsQuery,
  validateCalendarQuery
} = require('../validators/analyticsValidator');

const router = express.Router();

// All analytics endpoints require user authentication
router.use(authenticate);

// GET /api/analytics/recent - Chronological 11 latest entries
router.get('/recent', analyticsController.getRecent);

// GET /api/analytics/summary - Latest 5 vs previous 5 comparison
router.get('/summary', analyticsController.getSummary);

// GET /api/analytics/trends - Time-series trend (7d, 30d, 90d, 180d, 365d)
router.get('/trends', validateTrendsQuery, analyticsController.getTrends);

// GET /api/analytics/streak - Current streak, longest streak, total days
router.get('/streak', analyticsController.getStreak);

// GET /api/analytics/calendar - Monthly entries grouped by date
router.get('/calendar', validateCalendarQuery, analyticsController.getCalendar);

// GET /api/analytics/weather - Weather vs mood correlation analysis
router.get('/weather', analyticsController.getWeather);

module.exports = router;
