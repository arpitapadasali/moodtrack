const config = require('../config');

/**
 * Global centralized error handling middleware
 * Sanitizes internal server errors in production to prevent schema/stack leakage
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';

  // Handle express.json() payload size limit errors
  if (err.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Request payload exceeds maximum allowed size limit (100KB).';
  }

  // Handle MongoDB / Mongoose duplicate key errors (code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    message = 'A record with this unique field already exists.';
  }

  // Handle Mongoose CastError (e.g. invalid ObjectId format)
  if (err.name === 'CastError') {
    statusCode = 404;
    message = 'The requested resource was not found or invalid identifier format.';
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const firstError = Object.values(err.errors || {})[0];
    message = firstError ? firstError.message : 'Validation error occurred.';
  }

  // Handle JWT parsing errors if bubbled up
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired. Please log in again.';
  }

  // In production, mask unhandled 500 internal server errors
  const isProduction = config.nodeEnv === 'production';
  if (statusCode >= 500 && isProduction) {
    message = 'An unexpected internal server error occurred. Please try again later.';
  }

  // Log error securely
  console.error(`[Error] ${req.method} ${req.originalUrl} (${statusCode}):`, err.message);

  res.status(statusCode).json({
    success: false,
    message,
    ...(!isProduction && { stack: err.stack, details: err.code || undefined })
  });
};

module.exports = errorHandler;
