const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const routes = require('./routes');
const { apiLimiter } = require('./middleware/rateLimiter');
const notFoundHandler = require('./middleware/notFoundHandler');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Disable X-Powered-By header to minimize fingerprinting
app.disable('x-powered-by');

// 1. Security Headers (Helmet)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false // Handled or configured per-route/SPA
  })
);

// 2. Strict CORS Configuration
const allowedOrigins = [
  config.clientUrl,
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser agents (cURL, mobile clients, health probes)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes(origin) ||
        (config.nodeEnv === 'development' && /^http:\/\/localhost:\d+$/.test(origin))
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked request from origin "${origin}".`));
    },
    credentials: true,
    exposedHeaders: ['Content-Disposition'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// 3. Body Parsers with Safe Size Limits (DoS protection)
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Root Welcome Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to MoodTrack API',
    endpoints: {
      health: '/api/health'
    }
  });
});

// 4. API Routes protected with Rate Limiting
app.use('/api', apiLimiter, routes);

// 404 & Global Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
