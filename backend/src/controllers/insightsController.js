const insightsService = require('../services/insightsService');
const mlClientService = require('../services/mlClientService');

/**
 * Generate rule-based mood and sleep insights for authenticated user
 * @route GET /api/insights
 */
const getInsights = async (req, res, next) => {
  try {
    const data = await insightsService.generateInsights(req.userId);
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve statistical ML pattern predictions for authenticated user
 * by delegating anonymized numerical time-series to the Python FastAPI service.
 * @route GET /api/insights/ml
 */
const getMlInsights = async (req, res, next) => {
  try {
    const mlResult = await mlClientService.getUserMlInsights(req.userId);
    res.status(200).json({
      success: true,
      data: mlResult
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Predict patterns over custom numerical arrays passed in body
 * @route POST /api/insights/ml/predict
 */
const predictCustomMlPatterns = async (req, res, next) => {
  try {
    const { entries, recent_mood_values, recent_sleep_values, min_required } = req.body;
    const mlResult = await mlClientService.sendToMlService({
      entries,
      recent_mood_values,
      recent_sleep_values,
      min_required
    });
    res.status(200).json({
      success: true,
      data: mlResult
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check connectivity to Python FastAPI ML service
 * @route GET /api/insights/ml/health
 */
const getMlHealth = async (req, res, next) => {
  try {
    const health = await mlClientService.checkMlServiceHealth();
    res.status(200).json({
      success: true,
      data: health
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInsights,
  getMlInsights,
  predictCustomMlPatterns,
  getMlHealth
};
