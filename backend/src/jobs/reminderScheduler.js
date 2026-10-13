const cron = require('node-cron');
const config = require('../config');
const reminderService = require('../services/reminderService');

let scheduledTask = null;

/**
 * Start the background cron job for checking and dispatching mood reminders
 */
const startReminderJob = () => {
  if (!config.reminders.enabled) {
    console.log('⏳ [ReminderScheduler] Reminders background job is disabled by configuration (REMINDERS_ENABLED=false).');
    return null;
  }

  const schedule = config.reminders.cronSchedule;

  // Validate cron schedule syntax
  if (!cron.validate(schedule)) {
    console.error(`❌ [ReminderScheduler] Invalid cron expression: "${schedule}". Scheduler not started.`);
    return null;
  }

  console.log(`⏱️ [ReminderScheduler] Initializing reminder background job with schedule: "${schedule}"`);

  scheduledTask = cron.schedule(
    schedule,
    async () => {
      try {
        await reminderService.checkAndTriggerReminders();
      } catch (err) {
        console.error('❌ [ReminderScheduler] Uncaught error during reminder job cycle:', err);
      }
    },
    {
      scheduled: true,
      timezone: 'UTC' // Cron triggers in UTC; user specific timezone is applied per-user inside the service
    }
  );

  console.log('✅ [ReminderScheduler] Reminder background job is active and running.');
  return scheduledTask;
};

/**
 * Stop the background cron job gracefully
 */
const stopReminderJob = () => {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('🛑 [ReminderScheduler] Reminder background job has been stopped.');
  }
};

/**
 * Trigger an immediate manual check (useful for tests or triggers)
 */
const triggerImmediateCheck = async () => {
  return await reminderService.checkAndTriggerReminders();
};

module.exports = {
  startReminderJob,
  stopReminderJob,
  triggerImmediateCheck
};
