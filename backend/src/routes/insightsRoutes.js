const express = require('express');
const insightsController = require('../controllers/insightsController');
const authenticate = require('../middleware/authMiddleware');

const router = express.Router();

// All insight queries require user authentication
router.use(authenticate);

// GET /api/insights - Rule-based mood, sleep, correlation, and pattern insights
router.get('/', insightsController.getInsights);

// GET /api/insights/ml - Retrieve ML-driven pattern detection for authenticated user
router.get('/ml', insightsController.getMlInsights);

// GET /api/insights/ml/health - Health & connectivity status for the Python FastAPI service
router.get('/ml/health', insightsController.getMlHealth);

// POST /api/insights/ml/predict - Ad-hoc pattern prediction on numerical input arrays
router.post('/ml/predict', insightsController.predictCustomMlPatterns);

module.exports = router;
