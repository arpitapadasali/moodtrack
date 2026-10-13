const express = require('express');
const moodController = require('../controllers/moodController');
const authenticate = require('../middleware/authMiddleware');
const {
  validateDateParam,
  validateCreateMood,
  validateUpdateMood
} = require('../validators/moodValidator');

const router = express.Router();

// All routes require user authentication
router.use(authenticate);

// Specific named endpoints first to avoid routing collision with /:date
// GET /api/moods/today
router.get('/today', moodController.getToday);

// GET /api/moods/recent
router.get('/recent', moodController.getRecent);

// GET /api/moods/summary
router.get('/summary', moodController.getSummary);

// Root collection endpoint: POST /api/moods
router.post('/', validateCreateMood, moodController.createEntry);

// Parameterized date endpoints: GET, PUT, DELETE /api/moods/:date
router.get('/:date', validateDateParam, moodController.getByDate);
router.put('/:date', validateDateParam, validateUpdateMood, moodController.updateByDate);
router.delete('/:date', validateDateParam, moodController.deleteByDate);

module.exports = router;
