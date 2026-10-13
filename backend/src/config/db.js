const mongoose = require('mongoose');
const config = require('./index');

/**
 * Reusable MongoDB connection module using Mongoose.
 * Prevents multiple connections during development and hot-reloading.
 */
let isConnecting = false;

const connectDB = async () => {
  // If already connected (readyState 1), reuse the connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If connection is in progress, wait for it
  if (isConnecting) {
    return new Promise((resolve, reject) => {
      mongoose.connection.once('connected', () => resolve(mongoose.connection));
      mongoose.connection.once('error', (err) => reject(err));
    });
  }

  const mongoUri = config.mongodb.uri;

  if (!mongoUri) {
    const errorMsg = 'MONGODB_URI is not defined in backend/.env. Please configure your MongoDB Atlas connection string.';
    console.error(`[Database Error] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  try {
    isConnecting = true;

    // Configure connection options
    const options = {
      autoIndex: config.nodeEnv !== 'production', // Build indexes in dev/test, disable in high-scale prod if desired
      serverSelectionTimeoutMS: 5000 // Fail fast if MongoDB server is unavailable (5 seconds)
    };

    if (config.mongodb.dbName) {
      options.dbName = config.mongodb.dbName;
    }

    const conn = await mongoose.connect(mongoUri, options);

    // Sanitize URI for safe logging (mask username:password)
    const sanitizedUri = mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
    console.log(`[Database] MongoDB connected successfully to host: ${conn.connection.host} (DB: ${conn.connection.name}) [URI: ${sanitizedUri}]`);

    isConnecting = false;
    return conn.connection;
  } catch (error) {
    isConnecting = false;
    // Sanitize any URI details in the error message
    const sanitizedErrorMsg = error.message.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
    console.error(`[Database Error] Failed to connect to MongoDB: ${sanitizedErrorMsg}`);

    if (error.name === 'MongooseServerSelectionError') {
      console.error(
        '[Database Troubleshooting] Server selection timed out. Please check:\n' +
        '  1. Network Access / IP Access List in MongoDB Atlas (ensure your current IP is whitelisted or 0.0.0.0/0 is added)\n' +
        '  2. Database user credentials (username and password in backend/.env)\n' +
        '  3. Special characters in password must be URL-encoded (e.g., %40 for @)\n' +
        '  4. Internet connection and firewall permissions'
      );
    }
    throw error;
  }
};

const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[Database] MongoDB disconnected.');
  }
};

const isDbConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Event handlers
mongoose.connection.on('disconnected', () => {
  console.warn('[Database Warning] MongoDB disconnected.');
});

mongoose.connection.on('error', (err) => {
  console.error('[Database Error] MongoDB runtime error:', err.message);
});

module.exports = {
  connectDB,
  disconnectDB,
  isDbConnected,
  mongoose
};
