/**
 * Helper to check and parse date string in YYYY-MM-DD or ISO format
 */
const parseDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;

  // Match YYYY-MM-DD
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    const d = new Date(Date.UTC(year, month, day));
    if (d.getUTCFullYear() === year && d.getUTCMonth() === month && d.getUTCDate() === day) {
      return d;
    }
  }

  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

/**
 * Validate incoming :date route parameter
 */
const validateDateParam = (req, res, next) => {
  const { date } = req.params;
  const parsed = parseDate(date);

  if (!parsed) {
    return res.status(400).json({
      success: false,
      message: 'Invalid date parameter. Please provide a valid date in YYYY-MM-DD format.'
    });
  }

  req.parsedDate = parsed;
  next();
};

/**
 * Validate body for POST /api/moods
 */
const validateCreateMood = (req, res, next) => {
  const { mood, sleepHours, feelings, reflection, entryDate } = req.body;
  const errors = [];

  // 1. Mood scale 1 to 5 validation
  const parsedMood = Number(mood);
  if (mood === undefined || mood === null || isNaN(parsedMood) || !Number.isInteger(parsedMood)) {
    errors.push('Mood is required and must be an integer between 1 and 5.');
  } else if (parsedMood < 1 || parsedMood > 5) {
    errors.push('Mood must be between 1 and 5 (between 1 Very Bad and 5 Excellent).');
  }

  // 2. Sleep hours sensible value validation
  const parsedSleep = Number(sleepHours);
  if (sleepHours === undefined || sleepHours === null || isNaN(parsedSleep)) {
    errors.push('Sleep hours is required and must be a valid number.');
  } else if (parsedSleep < 0 || parsedSleep > 24) {
    errors.push('Sleep hours must be between 0 and 24 hours.');
  }

  // 3. Entry date validation
  let targetDate;
  if (!entryDate) {
    // Defaults to today
    const now = new Date();
    targetDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  } else {
    targetDate = parseDate(entryDate);
    if (!targetDate) {
      errors.push('entryDate must be a valid date in YYYY-MM-DD format.');
    }
  }

  // 4. Feelings array & length validation
  if (feelings !== undefined && feelings !== null) {
    if (!Array.isArray(feelings)) {
      errors.push('Feelings must be an array of strings.');
    } else {
      if (feelings.length > 20) {
        errors.push('Feelings cannot exceed 20 items (cannot select more than 20 feelings).');
      }
      for (const item of feelings) {
        if (typeof item !== 'string' || item.trim().length === 0) {
          errors.push('Each feeling tag must be a non-empty string.');
          break;
        } else if (item.trim().length > 30) {
          errors.push(`Feeling tag "${item}" cannot exceed 30 characters (exceeds maximum length of 30 characters).`);
          break;
        }
      }
    }
  }

  // 5. Reflection length validation
  if (reflection !== undefined && reflection !== null) {
    if (typeof reflection !== 'string') {
      errors.push('Reflection must be a string.');
    } else if (reflection.length > 2000) {
      errors.push('Reflection cannot exceed 2000 characters.');
    }
  }

  // 6. Optional location validation
  let sanitizedLocation = null;
  const { location, temperature, weatherCondition, precipitation } = req.body;
  if (location !== undefined && location !== null) {
    if (typeof location !== 'string') {
      errors.push('Location must be a string specifying city or region.');
    } else if (location.trim().length > 100) {
      errors.push('Location cannot exceed 100 characters.');
    } else {
      sanitizedLocation = location.trim();
    }
  }

  // 7. Optional explicit temperature, condition, precipitation
  let parsedTemp = null;
  if (temperature !== undefined && temperature !== null && temperature !== '') {
    const t = Number(temperature);
    if (isNaN(t) || t < -60 || t > 60) {
      errors.push('Temperature must be a valid number between -60°C and 60°C.');
    } else {
      parsedTemp = Math.round(t * 10) / 10;
    }
  }

  let sanitizedCondition = null;
  if (weatherCondition !== undefined && weatherCondition !== null && weatherCondition !== '') {
    if (typeof weatherCondition !== 'string') {
      errors.push('Weather condition must be a string.');
    } else {
      sanitizedCondition = weatherCondition.trim().slice(0, 50);
    }
  }

  let parsedPrecip = null;
  if (precipitation !== undefined && precipitation !== null && precipitation !== '') {
    const p = Number(precipitation);
    if (isNaN(p) || p < 0 || p > 1000) {
      errors.push('Precipitation must be a non-negative number.');
    } else {
      parsedPrecip = Math.round(p * 10) / 10;
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  req.sanitizedBody = {
    mood: parsedMood,
    sleepHours: parsedSleep,
    entryDate: targetDate,
    feelings: Array.isArray(feelings) ? feelings.map(f => f.trim().toLowerCase()).filter(Boolean) : [],
    reflection: typeof reflection === 'string' ? reflection.trim() : null,
    location: sanitizedLocation,
    temperature: parsedTemp,
    weatherCondition: sanitizedCondition,
    precipitation: parsedPrecip
  };

  next();
};

/**
 * Validate body for PUT /api/moods/:date
 */
const validateUpdateMood = (req, res, next) => {
  const { mood, sleepHours, feelings, reflection } = req.body;
  const errors = [];
  const updates = {};

  if (mood !== undefined) {
    const parsedMood = Number(mood);
    if (isNaN(parsedMood) || !Number.isInteger(parsedMood) || parsedMood < 1 || parsedMood > 5) {
      errors.push('Mood must be an integer between 1 (Very Bad) and 5 (Excellent).');
    } else {
      updates.mood = parsedMood;
    }
  }

  if (sleepHours !== undefined) {
    const parsedSleep = Number(sleepHours);
    if (isNaN(parsedSleep) || parsedSleep < 0 || parsedSleep > 24) {
      errors.push('Sleep hours must be a number between 0 and 24.');
    } else {
      updates.sleepHours = parsedSleep;
    }
  }

  if (feelings !== undefined) {
    if (!Array.isArray(feelings)) {
      errors.push('Feelings must be an array of strings.');
    } else {
      if (feelings.length > 20) {
        errors.push('Cannot select more than 20 feelings.');
      }
      for (const item of feelings) {
        if (typeof item !== 'string' || item.trim().length === 0) {
          errors.push('Each feeling tag must be a non-empty string.');
          break;
        } else if (item.trim().length > 30) {
          errors.push(`Feeling tag "${item}" exceeds maximum length of 30 characters.`);
          break;
        }
      }
      updates.feelings = feelings.map(f => String(f).trim().toLowerCase()).filter(Boolean);
    }
  }

  if (reflection !== undefined) {
    if (typeof reflection !== 'string') {
      errors.push('Reflection must be a string.');
    } else if (reflection.length > 2000) {
      errors.push('Reflection cannot exceed 2000 characters.');
    } else {
      updates.reflection = reflection.trim();
    }
  }

  const { location, temperature, weatherCondition, precipitation } = req.body;
  if (location !== undefined) {
    if (location !== null && typeof location !== 'string') {
      errors.push('Location must be a string.');
    } else if (location && location.trim().length > 100) {
      errors.push('Location cannot exceed 100 characters.');
    } else {
      updates.location = location ? location.trim() : null;
    }
  }

  if (temperature !== undefined) {
    if (temperature === null || temperature === '') {
      updates.temperature = null;
    } else {
      const t = Number(temperature);
      if (isNaN(t) || t < -60 || t > 60) {
        errors.push('Temperature must be a valid number between -60°C and 60°C.');
      } else {
        updates.temperature = Math.round(t * 10) / 10;
      }
    }
  }

  if (weatherCondition !== undefined) {
    if (weatherCondition === null || weatherCondition === '') {
      updates.weatherCondition = null;
    } else if (typeof weatherCondition !== 'string') {
      errors.push('Weather condition must be a string.');
    } else {
      updates.weatherCondition = weatherCondition.trim().slice(0, 50);
    }
  }

  if (precipitation !== undefined) {
    if (precipitation === null || precipitation === '') {
      updates.precipitation = null;
    } else {
      const p = Number(precipitation);
      if (isNaN(p) || p < 0 || p > 1000) {
        errors.push('Precipitation must be a non-negative number.');
      } else {
        updates.precipitation = Math.round(p * 10) / 10;
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  req.sanitizedBody = updates;
  next();
};

module.exports = {
  parseDate,
  validateDateParam,
  validateCreateMood,
  validateUpdateMood
};
