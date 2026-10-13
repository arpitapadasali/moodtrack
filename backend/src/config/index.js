const path = require('path');
const dotenv = require('dotenv');

// Load environment variables explicitly from backend/.env file
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

const nodeEnv = process.env.NODE_ENV || 'development';
const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret_dev_only_change_in_production_min_32_chars';

// In production, enforce that a cryptographically secure JWT secret is configured
if (nodeEnv === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET.includes('default')) {
    throw new Error(
      'SECURITY ERROR: A secure JWT_SECRET of at least 32 characters must be set in production environment variables.'
    );
  }
} else if (!process.env.JWT_SECRET) {
  console.warn('[Security Warning] JWT_SECRET is not set in environment. Using fallback development secret.');
}

// Database configuration validation
const mongodbUri = process.env.MONGODB_URI;
if (!mongodbUri) {
  console.warn(
    '[Configuration Warning] MONGODB_URI is not set in environment (backend/.env). ' +
    'Please set MONGODB_URI in your backend/.env file to connect to MongoDB Atlas.'
  );
}

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL,
  mongodb: {
    uri: mongodbUri || '',
    dbName: process.env.MONGODB_DB_NAME || 'moodtrack_db'
  },
  jwt: {
    secret: jwtSecret,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  security: {
    saltRounds: parseInt(process.env.SALT_ROUNDS, 10) || 12,
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 500,
    rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
    authRateLimitMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 15,
    authRateLimitWindowMs: 15 * 60 * 1000 // 15 minutes
  },
  reminders: {
    enabled: process.env.REMINDERS_ENABLED !== 'false',
    cronSchedule: process.env.REMINDER_CRON_SCHEDULE || '* * * * *'
  },
  weather: {
    apiKey: process.env.WEATHER_API_KEY || ''
  }
};

module.exports = config;
