const { Reminder, MoodEntry } = require('../models');
const { isDbConnected } = require('../config/db');
const notificationService = require('./notificationService');
const reminderTracker = require('./reminderTracker');

/**
 * Extract user's local date (YYYY-MM-DD) and 24h local time (HH:mm) for a given IANA timezone
 * @param {string} timezone - e.g. "America/New_York", "Asia/Kolkata", "UTC"
 * @param {Date} [date=new Date()]
 * @returns {{localDate: string, localTime: string, hour: number, minute: number}}
 */
function getUserLocalTime(timezone, date = new Date()) {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone || 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const parts = formatter.formatToParts(date);
    const getPart = (type) => parts.find((p) => p.type === type)?.value;

    const year = getPart('year');
    const month = getPart('month');
    const day = getPart('day');
    let hour = getPart('hour');
    if (hour === '24') hour = '00';
    const minute = getPart('minute');

    return {
      localDate: `${year}-${month}-${day}`,
      localTime: `${hour}:${minute}`,
      hour: parseInt(hour, 10),
      minute: parseInt(minute, 10)
    };
  } catch (err) {
    // Fallback to UTC if timezone is invalid or unrecognized
    const utcDate = date.toISOString().split('T')[0];
    const utcHour = String(date.getUTCHours()).padStart(2, '0');
    const utcMinute = String(date.getUTCMinutes()).padStart(2, '0');
    return {
      localDate: utcDate,
      localTime: `${utcHour}:${utcMinute}`,
      hour: date.getUTCHours(),
      minute: date.getUTCMinutes()
    };
  }
}

/**
 * Fetch reminder preferences for the authenticated user
 * If no record exists yet, creates and returns sensible default settings.
 * @param {string} userId
 */
const getUserReminder = async (userId) => {
  let reminder = await Reminder.findOne({ userId });

  if (!reminder) {
    reminder = await Reminder.create({
      userId,
      enabled: true,
      reminderTime: '20:00',
      timezone: 'UTC'
    });
  }

  return reminder;
};

/**
 * Update reminder preferences for the authenticated user
 * @param {string} userId
 * @param {object} updates - { enabled, reminderTime, timezone }
 */
const updateUserReminder = async (userId, { enabled, reminderTime, timezone }) => {
  const existing = await Reminder.findOne({ userId });

  const updateData = {};
  if (enabled !== undefined) updateData.enabled = Boolean(enabled);
  if (reminderTime !== undefined) updateData.reminderTime = reminderTime.trim();
  if (timezone !== undefined) updateData.timezone = timezone.trim();

  let reminder;
  if (existing) {
    Object.assign(existing, updateData);
    reminder = await existing.save();
  } else {
    reminder = await Reminder.create({
      userId,
      enabled: enabled !== undefined ? Boolean(enabled) : true,
      reminderTime: reminderTime ? reminderTime.trim() : '20:00',
      timezone: timezone ? timezone.trim() : 'UTC'
    });
  }

  return reminder;
};

/**
 * Core Reminder Evaluation Engine
 * Evaluates all active reminders, checks against timezone, user entry status, and persistent sent state.
 * Called on schedule by node-cron background job.
 */
const checkAndTriggerReminders = async () => {
  try {
    // 0. Ensure database connection is active before querying
    if (!isDbConnected()) {
      return { checked: 0, triggered: 0, skipped: true, reason: 'Database is disconnected' };
    }

    // 1. Query all users with enabled reminders and populate user credentials
    const activeReminders = await Reminder.find({ enabled: true }).populate('userId', 'name email');

    if (!activeReminders || activeReminders.length === 0) {
      return { checked: 0, triggered: 0 };
    }

    let triggeredCount = 0;
    const now = new Date();

    for (const reminder of activeReminders) {
      const user = reminder.userId;
      if (!user) continue;

      const userIdStr = user._id ? user._id.toString() : user.id;

      // 2. Compute user's local date and time accounting for their timezone
      const { localDate, localTime } = getUserLocalTime(reminder.timezone, now);

      // 3. Check if the scheduled reminder time has arrived in user's timezone
      if (localTime < reminder.reminderTime) {
        // Not yet time for this user today
        continue;
      }

      // 4. Prevent duplicate reminders for today across server restarts
      if (reminderTracker.hasReminderBeenSent(userIdStr, localDate)) {
        continue;
      }

      // 5. Check if user has already created today's mood entry for localDate
      const [year, month, day] = localDate.split('-').map(Number);
      const targetMidnightUTC = new Date(Date.UTC(year, month - 1, day));

      const existingEntry = await MoodEntry.findOne({
        userId: userIdStr,
        entryDate: targetMidnightUTC
      });

      if (existingEntry) {
        // User already checked in today! No reminder needed.
        reminderTracker.markReminderSent(userIdStr, localDate);
        continue;
      }

      // 6. User has NOT created today's mood entry and reminder time has arrived!
      await notificationService.sendReminderNotification({
        user: {
          id: userIdStr,
          name: user.name,
          email: user.email
        },
        reminder,
        localDate,
        localTime
      });

      // 7. Persist sent state to prevent duplicates
      reminderTracker.markReminderSent(userIdStr, localDate);
      triggeredCount += 1;
    }

    // Clean up tracking records older than 14 days
    reminderTracker.cleanupOldRecords();

    return {
      checked: activeReminders.length,
      triggered: triggeredCount
    };
  } catch (error) {
    console.error('[ReminderService] Error evaluating scheduled reminders:', error);
    return { checked: 0, triggered: 0, error: error.message };
  }
};

module.exports = {
  getUserLocalTime,
  getUserReminder,
  updateUserReminder,
  checkAndTriggerReminders
};
