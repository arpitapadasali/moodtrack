/**
 * Notification Service Abstraction
 * Manages dispatching reminders to users across multiple potential delivery channels.
 * For initial implementation, logs reminder events clearly to the backend console.
 */
class NotificationService {
  constructor() {
    this.name = 'NotificationService';
  }

  /**
   * Dispatch a daily check-in reminder to a user
   * @param {object} params
   * @param {object} params.user - { id, name, email }
   * @param {object} params.reminder - { id, reminderTime, timezone }
   * @param {string} params.localDate - User's local date (YYYY-MM-DD)
   * @param {string} params.localTime - User's local time (HH:mm)
   * @returns {Promise<{success: boolean, deliveryChannel: string, timestamp: string}>}
   */
  async sendReminderNotification({ user, reminder, localDate, localTime }) {
    const timestamp = new Date().toISOString();
    const recipientName = user.name || 'Friend';
    const message = `Hi ${recipientName}, it's time for your daily MoodTrack check-in! Take a brief moment to record your mood, feelings, and sleep for ${localDate}.`;

    // Clear and prominent structured backend log for observability
    console.log('\n============================================================');
    console.log('🔔 [MOODTRACK REMINDER NOTIFICATION DISPATCHED]');
    console.log(`⏰ Timestamp (UTC): ${timestamp}`);
    console.log(`👤 Recipient:       ${recipientName} (${user.email}) [ID: ${user.id}]`);
    console.log(`🌍 Timezone:        ${reminder.timezone} (Local Time: ${localTime})`);
    console.log(`📅 Target Date:     ${localDate}`);
    console.log(`🕒 Scheduled At:    ${reminder.reminderTime}`);
    console.log(`📢 Channel:         Console / Log Stream (Service Abstraction Active)`);
    console.log(`💬 Message:         "${message}"`);
    console.log('============================================================\n');

    return {
      success: true,
      deliveryChannel: 'console_log',
      timestamp,
      recipient: user.email,
      targetDate: localDate
    };
  }

  /**
   * Future channel stub: Email notification
   */
  async sendEmail(to, subject, body) {
    // Reserved for future email transport (e.g. Nodemailer / SendGrid)
    console.log(`[NotificationService] Email stub called for ${to}: ${subject}`);
    return { success: true, channel: 'email' };
  }

  /**
   * Future channel stub: Web Push notification
   */
  async sendPushNotification(subscription, payload) {
    // Reserved for future web push notifications
    console.log(`[NotificationService] Push stub called`);
    return { success: true, channel: 'push' };
  }
}

module.exports = new NotificationService();
