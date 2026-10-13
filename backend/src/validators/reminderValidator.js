const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Validate IANA timezone string
 */
function isValidTimezone(tz) {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Middleware to validate PUT /api/reminders payload
 */
const validateUpdateReminder = (req, res, next) => {
  const { enabled, reminderTime, timezone } = req.body;
  const errors = [];

  // Validate enabled
  if (enabled !== undefined && typeof enabled !== 'boolean') {
    errors.push('The "enabled" field must be a boolean (true or false).');
  }

  // Validate reminderTime (24h format HH:mm)
  if (reminderTime !== undefined) {
    if (typeof reminderTime !== 'string' || !TIME_REGEX.test(reminderTime.trim())) {
      errors.push('The "reminderTime" field must be in 24-hour "HH:mm" format (e.g. "20:00" or "09:30").');
    } else {
      req.body.reminderTime = reminderTime.trim();
    }
  }

  // Validate timezone
  if (timezone !== undefined) {
    if (typeof timezone !== 'string' || !isValidTimezone(timezone.trim())) {
      errors.push('The "timezone" field must be a valid IANA timezone (e.g. "America/New_York", "Asia/Kolkata", "UTC").');
    } else {
      req.body.timezone = timezone.trim();
    }
  }

  if (enabled === undefined && reminderTime === undefined && timezone === undefined) {
    errors.push('At least one reminder setting (enabled, reminderTime, or timezone) must be provided.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

module.exports = {
  validateUpdateReminder,
  isValidTimezone
};
