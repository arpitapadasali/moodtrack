const analyticsService = require('../services/analyticsService');
const weatherAnalyticsService = require('../services/weatherAnalyticsService');

/**
 * Return user's latest 11 entries chronologically for charts
 * @route GET /api/analytics/recent
 */
const getRecent = async (req, res, next) => {
  try {
    const entries = await analyticsService.getRecentAnalytics(req.userId);
    res.status(200).json({
      success: true,
      data: entries
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5-vs-5 check-in summary comparison (latest 5 vs previous 5, mood & sleep change percentages)
 * @route GET /api/analytics/summary
 */
const getSummary = async (req, res, next) => {
  try {
    const summary = await analyticsService.getComparisonSummary(req.userId);
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Time-series trend over 7d, 30d, 90d, 180d, or 365d
 * @route GET /api/analytics/trends
 */
const getTrends = async (req, res, next) => {
  try {
    const trends = await analyticsService.getTrends(req.userId, req.trendDays);
    res.status(200).json({
      success: true,
      data: trends
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Streak analytics: current streak, longest streak, total check-in days
 * @route GET /api/analytics/streak
 */
const getStreak = async (req, res, next) => {
  try {
    const streak = await analyticsService.getStreakAnalytics(req.userId);
    res.status(200).json({
      success: true,
      data: streak
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Monthly calendar records grouped by date
 * @route GET /api/analytics/calendar
 */
const getCalendar = async (req, res, next) => {
  try {
    const calendar = await analyticsService.getCalendarData(
      req.userId,
      req.calendarYear,
      req.calendarMonth
    );
    res.status(200).json({
      success: true,
      data: calendar
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Weather vs Mood correlation analytics:
 * - mood vs temperature
 * - mood vs weather condition
 * - mood vs precipitation
 * @route GET /api/analytics/weather
 */
const getWeather = async (req, res, next) => {
  try {
    const weatherData = await weatherAnalyticsService.getWeatherAnalytics(req.userId);
    res.status(200).json({
      success: true,
      data: weatherData
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecent,
  getSummary,
  getTrends,
  getStreak,
  getCalendar,
  getWeather
};
