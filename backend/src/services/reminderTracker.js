const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const STORE_FILE = path.join(DATA_DIR, 'sent_reminders.json');

/**
 * Persistent Reminder Tracking Store
 * Prevents duplicate reminders across server restarts by maintaining a lightweight disk-backed registry.
 */
class ReminderTracker {
  constructor() {
    this.sentMap = new Map();
    this.initStore();
  }

  /**
   * Initialize storage directory and load existing records
   */
  initStore() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(STORE_FILE)) {
        const raw = fs.readFileSync(STORE_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        for (const [key, value] of Object.entries(parsed)) {
          this.sentMap.set(key, value);
        }
      } else {
        this.saveToDisk();
      }
    } catch (err) {
      console.warn('[ReminderTracker] Warning: could not load sent_reminders.json, starting with empty map:', err.message);
    }
  }

  /**
   * Persist current in-memory map to disk
   */
  saveToDisk() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const obj = Object.fromEntries(this.sentMap);
      fs.writeFileSync(STORE_FILE, JSON.stringify(obj, null, 2), 'utf8');
    } catch (err) {
      console.warn('[ReminderTracker] Failed to persist sent reminders to disk:', err.message);
    }
  }

  /**
   * Check if a reminder has already been dispatched for this user and local date
   * @param {string} userId
   * @param {string} localDate - YYYY-MM-DD
   * @returns {boolean}
   */
  hasReminderBeenSent(userId, localDate) {
    const key = `${userId}_${localDate}`;
    return this.sentMap.has(key);
  }

  /**
   * Mark a reminder as sent for this user and local date
   * @param {string} userId
   * @param {string} localDate - YYYY-MM-DD
   */
  markReminderSent(userId, localDate) {
    const key = `${userId}_${localDate}`;
    this.sentMap.set(key, new Date().toISOString());
    this.saveToDisk();
  }

  /**
   * Clean up records older than 14 days to keep storage lean
   */
  cleanupOldRecords() {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const cutoffDateStr = fourteenDaysAgo.toISOString().split('T')[0];

    let modified = false;
    for (const [key] of this.sentMap.entries()) {
      const parts = key.split('_');
      const datePart = parts[parts.length - 1];
      if (datePart < cutoffDateStr) {
        this.sentMap.delete(key);
        modified = true;
      }
    }

    if (modified) {
      this.saveToDisk();
    }
  }
}

module.exports = new ReminderTracker();
