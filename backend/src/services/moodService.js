const mongoose = require('mongoose');
const { MoodEntry } = require('../models');
const weatherService = require('./weatherService');

/**
 * Normalize date to UTC midnight
 */
const toMidnightUTC = (date) => {
  const d = date ? new Date(date) : new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

/**
 * Fetch today's mood entry for the authenticated user
 * @param {string} userId
 */
const getTodayEntry = async (userId) => {
  const todayUTC = toMidnightUTC();
  return MoodEntry.findOne({
    userId,
    entryDate: todayUTC
  });
};

/**
 * Fetch recent mood entries for the authenticated user
 * @param {string} userId
 * @param {number} [limit=11]
 */
const getRecentEntries = async (userId, limit = 11) => {
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 11, 1), 100);
  return MoodEntry.find({ userId })
    .sort({ entryDate: -1 })
    .limit(parsedLimit);
};

/**
 * Fetch a specific mood entry by date for the authenticated user
 * @param {string} userId
 * @param {Date} entryDate
 */
const getEntryByDate = async (userId, entryDate) => {
  const targetDate = toMidnightUTC(entryDate);
  const entry = await MoodEntry.findOne({
    userId,
    entryDate: targetDate
  });

  if (!entry) {
    const error = new Error(`No mood entry found for date ${targetDate.toISOString().split('T')[0]}.`);
    error.statusCode = 404;
    throw error;
  }

  return entry;
};

/**
 * Create a new mood entry for the user
 * Rejects with 409 if an entry already exists for the given date
 * @param {string} userId
 * @param {object} entryData - { mood, sleepHours, feelings, reflection, entryDate, location, temperature, weatherCondition, precipitation }
 */
const createMoodEntry = async (
  userId,
  { mood, sleepHours, feelings, reflection, entryDate, location, temperature, weatherCondition, precipitation }
) => {
  const targetDate = toMidnightUTC(entryDate);

  // Check if an entry already exists for this user and date
  const existing = await MoodEntry.findOne({
    userId,
    entryDate: targetDate
  });

  if (existing) {
    const dateFormatted = targetDate.toISOString().split('T')[0];
    const error = new Error(`A mood entry already exists for ${dateFormatted}. Please update the existing entry instead.`);
    error.statusCode = 409;
    throw error;
  }

  // Attempt to resolve weather information if location provided (and not already explicitly passed)
  let finalTemp = temperature !== undefined && temperature !== null ? temperature : null;
  let finalCondition = weatherCondition !== undefined && weatherCondition !== null ? weatherCondition : null;
  let finalPrecip = precipitation !== undefined && precipitation !== null ? precipitation : null;

  if (location && (finalTemp === null || finalCondition === null)) {
    try {
      const fetchedWeather = await weatherService.getWeatherForLocation(location);
      if (fetchedWeather) {
        if (finalTemp === null && fetchedWeather.temperature !== null) {
          finalTemp = fetchedWeather.temperature;
        }
        if (finalCondition === null && fetchedWeather.weatherCondition !== null) {
          finalCondition = fetchedWeather.weatherCondition;
        }
        if (finalPrecip === null && fetchedWeather.precipitation !== null) {
          finalPrecip = fetchedWeather.precipitation;
        }
      }
    } catch (weatherErr) {
      console.warn('Weather retrieval error caught in moodService (non-fatal):', weatherErr.message);
    }
  }

  return MoodEntry.create({
    userId,
    entryDate: targetDate,
    mood,
    sleepHours,
    feelings: feelings || [],
    reflection: reflection || null,
    temperature: finalTemp,
    weatherCondition: finalCondition,
    precipitation: finalPrecip
  });
};

/**
 * Update an existing mood entry by date for the user
 * @param {string} userId
 * @param {Date} entryDate
 * @param {object} updates - partial fields { mood, sleepHours, feelings, reflection, location, temperature, weatherCondition, precipitation }
 */
const updateMoodEntryByDate = async (userId, entryDate, updates) => {
  const targetDate = toMidnightUTC(entryDate);

  // Verify the entry exists and belongs to the user
  const existing = await MoodEntry.findOne({
    userId,
    entryDate: targetDate
  });

  if (!existing) {
    const dateFormatted = targetDate.toISOString().split('T')[0];
    const error = new Error(`No mood entry found for ${dateFormatted} to update.`);
    error.statusCode = 404;
    throw error;
  }

  const sanitizedUpdates = { ...updates };
  const location = sanitizedUpdates.location;
  delete sanitizedUpdates.location; // Do not persist location string directly

  // If a location is provided during update and weather is not explicitly specified, try fetching weather
  if (location && (sanitizedUpdates.temperature === undefined || sanitizedUpdates.weatherCondition === undefined)) {
    try {
      const fetchedWeather = await weatherService.getWeatherForLocation(location);
      if (fetchedWeather) {
        if (sanitizedUpdates.temperature === undefined && fetchedWeather.temperature !== null) {
          sanitizedUpdates.temperature = fetchedWeather.temperature;
        }
        if (sanitizedUpdates.weatherCondition === undefined && fetchedWeather.weatherCondition !== null) {
          sanitizedUpdates.weatherCondition = fetchedWeather.weatherCondition;
        }
        if (sanitizedUpdates.precipitation === undefined && fetchedWeather.precipitation !== null) {
          sanitizedUpdates.precipitation = fetchedWeather.precipitation;
        }
      }
    } catch (weatherErr) {
      console.warn('Weather retrieval error caught in updateMoodEntryByDate (non-fatal):', weatherErr.message);
    }
  }

  Object.assign(existing, sanitizedUpdates);
  return existing.save();
};

/**
 * Delete a mood entry by date for the user
 * @param {string} userId
 * @param {Date} entryDate
 */
const deleteMoodEntryByDate = async (userId, entryDate) => {
  const targetDate = toMidnightUTC(entryDate);

  const existing = await MoodEntry.findOne({
    userId,
    entryDate: targetDate
  });

  if (!existing) {
    const dateFormatted = targetDate.toISOString().split('T')[0];
    const error = new Error(`No mood entry found for ${dateFormatted} to delete.`);
    error.statusCode = 404;
    throw error;
  }

  await MoodEntry.deleteOne({
    userId,
    entryDate: targetDate
  });

  return {
    deleted: true,
    entryDate: targetDate.toISOString().split('T')[0]
  };
};

/**
 * Calculate user's aggregate summary for dashboard cards
 * @param {string} userId
 */
const getMoodSummary = async (userId) => {
  const userObjId = new mongoose.Types.ObjectId(userId);

  const [totalEntries, aggResult, allDates] = await Promise.all([
    MoodEntry.countDocuments({ userId }),
    MoodEntry.aggregate([
      { $match: { userId: userObjId } },
      {
        $group: {
          _id: null,
          avgMood: { $avg: '$mood' },
          avgSleep: { $avg: '$sleepHours' }
        }
      }
    ]),
    MoodEntry.find({ userId })
      .select('entryDate')
      .sort({ entryDate: -1 })
  ]);

  const avgData = aggResult[0] || {};
  const averageMood = avgData.avgMood ? Number(avgData.avgMood.toFixed(1)) : 0;
  const averageSleep = avgData.avgSleep ? Number(avgData.avgSleep.toFixed(1)) : 0;

  let currentStreak = 0;
  if (allDates.length > 0) {
    const todayUTC = toMidnightUTC();
    const yesterdayUTC = new Date(todayUTC);
    yesterdayUTC.setUTCDate(yesterdayUTC.getUTCDate() - 1);

    const latestDate = toMidnightUTC(allDates[0].entryDate);

    if (latestDate.getTime() === todayUTC.getTime() || latestDate.getTime() === yesterdayUTC.getTime()) {
      let expectedDate = latestDate;
      const dateSet = new Set(allDates.map((d) => toMidnightUTC(d.entryDate).toISOString().split('T')[0]));

      while (dateSet.has(expectedDate.toISOString().split('T')[0])) {
        currentStreak += 1;
        expectedDate.setUTCDate(expectedDate.getUTCDate() - 1);
      }
    }
  }

  return {
    totalEntries,
    averageMood,
    averageSleep,
    currentStreak
  };
};

module.exports = {
  getTodayEntry,
  getRecentEntries,
  getEntryByDate,
  createMoodEntry,
  updateMoodEntryByDate,
  deleteMoodEntryByDate,
  getMoodSummary
};
