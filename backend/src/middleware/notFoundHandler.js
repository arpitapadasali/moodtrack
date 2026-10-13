/**
 * Middleware to handle requests to non-existent endpoints (404 Not Found)
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`
  });
};

module.exports = notFoundHandler;
