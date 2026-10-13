const app = require('./app');
const config = require('./config');
const { connectDB, disconnectDB } = require('./config/db');
const { startReminderJob, stopReminderJob } = require('./jobs/reminderScheduler');

let server;

async function startServer() {
  try {
    // Attempt MongoDB connection on startup
    console.log('[Startup] Connecting to MongoDB...');
    await connectDB();
  } catch (err) {
    console.warn(`[Startup Warning] Could not connect to MongoDB initially (${err.message}). Server will continue starting.`);
  }

  server = app.listen(config.port, () => {
    console.log(`MoodTrack API server is running on http://localhost:${config.port}`);
    console.log(`Environment: ${config.nodeEnv}`);

    // Start background scheduled reminder job
    startReminderJob();
  });
}

// Handle graceful shutdown
const gracefulShutdown = async () => {
  console.log('Shutting down server gracefully...');
  stopReminderJob();
  if (server) {
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  } else {
    await disconnectDB();
    process.exit(0);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle unhandled promise rejections gracefully
process.on('unhandledRejection', async (err) => {
  console.error('Unhandled Promise Rejection:', err);
  stopReminderJob();
  if (server) {
    server.close(async () => {
      await disconnectDB();
      process.exit(1);
    });
  } else {
    await disconnectDB();
    process.exit(1);
  }
});

startServer();

module.exports = server;
