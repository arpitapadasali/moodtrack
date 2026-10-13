const reminderService = require('../services/reminderService');

/**
 * Fetch current user's reminder settings
 * @route GET /api/reminders
 */
const getReminder = async (req, res, next) => {
  try {
    const reminder = await reminderService.getUserReminder(req.userId);
    res.status(200).json({
      success: true,
      data: reminder
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update current user's reminder settings
 * @route PUT /api/reminders
 */
const updateReminder = async (req, res, next) => {
  try {
    const { enabled, reminderTime, timezone } = req.body;
    const reminder = await reminderService.updateUserReminder(req.userId, {
      enabled,
      reminderTime,
      timezone
    });

    res.status(200).json({
      success: true,
      message: 'Reminder preferences updated successfully',
      data: reminder
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReminder,
  updateReminder
};
