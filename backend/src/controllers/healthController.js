const { isDbConnected } = require('../config/db');

/**
 * Controller to handle API health check
 * @route GET /api/health
 */
const getHealthStatus = (req, res) => {
  const dbStatus = isDbConnected() ? 'connected' : 'disconnected';
  const isHealthy = isDbConnected();

  const statusCode = isHealthy ? 200 : 503;

  res.status(statusCode).json({
    success: isHealthy,
    status: isHealthy ? 'healthy' : 'degraded',
    message: isHealthy ? 'MoodTrack API is running and connected to MongoDB' : 'MoodTrack API is running but database is disconnected',
    database: {
      provider: 'MongoDB',
      status: dbStatus
    },
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  getHealthStatus
};
