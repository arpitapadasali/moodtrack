/**
 * Allowed trend timeframes mapped to day counts
 */
const ALLOWED_RANGES = {
  '7d': 7,
  '7days': 7,
  '30d': 30,
  '30days': 30,
  '90d': 90,
  '90days': 90,
  '180d': 180,
  '6m': 180,
  '6months': 180,
  '365d': 365,
  '1y': 365,
  '1year': 365
};

/**
 * Validate query parameter for GET /api/analytics/trends
 */
const validateTrendsQuery = (req, res, next) => {
  if (req.query.days) {
    const parsedDays = parseInt(req.query.days, 10);
    if (!isNaN(parsedDays) && parsedDays > 0 && parsedDays <= 365) {
      req.trendDays = parsedDays;
      req.trendRangeLabel = `${parsedDays}d`;
      return next();
    }
  }

  const rawRange = (req.query.range || '30d').toString().trim().toLowerCase().replace(/\s+/g, '');

  if (!ALLOWED_RANGES[rawRange]) {
    return res.status(400).json({
      success: false,
      message: `Invalid range parameter "${req.query.range}". Allowed ranges: 7d, 30d, 90d, 6m (180d), 1y (365d).`
    });
  }

  req.trendDays = ALLOWED_RANGES[rawRange];
  req.trendRangeLabel = rawRange;
  next();
};

/**
 * Validate query parameter for GET /api/analytics/calendar
 */
const validateCalendarQuery = (req, res, next) => {
  const now = new Date();
  let year = req.query.year ? parseInt(req.query.year, 10) : now.getUTCFullYear();
  let month = req.query.month ? parseInt(req.query.month, 10) : now.getUTCMonth() + 1;

  if (isNaN(year) || year < 2000 || year > 2100) {
    return res.status(400).json({
      success: false,
      message: 'Invalid year. Must be between 2000 and 2100.'
    });
  }

  if (isNaN(month) || month < 1 || month > 12) {
    return res.status(400).json({
      success: false,
      message: 'Invalid month. Must be an integer between 1 and 12.'
    });
  }

  req.calendarYear = year;
  req.calendarMonth = month;
  next();
};

module.exports = {
  ALLOWED_RANGES,
  validateTrendsQuery,
  validateCalendarQuery
};
