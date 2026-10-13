const rateLimit = require('express-rate-limit');
const config = require('../config');

/**
 * General API Rate Limiter
 * Guards all /api routes against high-volume Denial of Service and scraping
 */
const apiLimiter = rateLimit({
  windowMs: config.security?.rateLimitWindowMs || 15 * 60 * 1000, // 15 minutes
  max: config.security?.rateLimitMax || 500, // Limit each IP to 500 requests per window
  standardHeaders: true, // Return RateLimit-* headers (draft-6 / draft-7 RFC)
  legacyHeaders: false, // Disable X-RateLimit-* headers
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.'
  }
});

/**
 * Strict Authentication Rate Limiter
 * Prevents automated credential-stuffing and brute-force password guessing on login/register
 */
const authLimiter = rateLimit({
  windowMs: config.security?.authRateLimitWindowMs || 15 * 60 * 1000, // 15 minutes
  max: config.security?.authRateLimitMax || 15, // Limit each IP to 15 auth attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
  }
});

module.exports = {
  apiLimiter,
  authLimiter
};
