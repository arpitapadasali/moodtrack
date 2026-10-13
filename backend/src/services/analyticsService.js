const mongoose = require('mongoose');
const { MoodEntry } = require('../models');

/**
 * Format Date to YYYY-MM-DD
 */
const formatDateStr = (d) => {
  if (!d) return '';
  const dateObj = new Date(d);
  return dateObj.toISOString().split('T')[0];
};

/**
 * 1. GET /api/analytics/recent
 * Return the user's most recent 11 mood entries ordered chronologically (oldest to newest)
 * for chart visualization.
 * @param {string} userId
 */
const getRecentAnalytics = async (userId) => {
  // Select top 11 latest entries sorted by entryDate desc, then sort them chronologically (asc)
  const entries = await MoodEntry.find({ userId })
    .sort({ entryDate: -1 })
    .limit(11);

  // Reverse to chronological order (oldest to newest)
  entries.reverse();

  return entries.map((r) => ({
    id: r._id ? r._id.toString() : r.id,
    date: formatDateStr(r.entryDate),
    mood: r.mood,
    sleepHours: r.sleepHours,
    feelings: r.feelings || [],
    reflection: r.reflection || '',
    temperature: r.temperature !== null && r.temperature !== undefined ? r.temperature : null,
    weatherCondition: r.weatherCondition || null,
    precipitation: r.precipitation !== null && r.precipitation !== undefined ? r.precipitation : null
  }));
};

/**
 * 2. GET /api/analytics/summary
 * Calculate:
 * - average mood for latest 5 check-ins
 * - average sleep for latest 5 check-ins
 * - average mood for previous 5 check-ins (check-ins 6 through 10)
 * - average sleep for previous 5 check-ins
 * - mood change percentage
 * - sleep change percentage
 * @param {string} userId
 */
const getComparisonSummary = async (userId) => {
  // Fetch up to 10 most recent entries
  const entries = await MoodEntry.find({ userId })
    .sort({ entryDate: -1 })
    .limit(10);

  const latest5Entries = entries.slice(0, 5);
  const previous5Entries = entries.slice(5, 10);

  const latestCount = latest5Entries.length;
  const previousCount = previous5Entries.length;

  let latestAvgMood = null;
  let latestAvgSleep = null;
  if (latestCount > 0) {
    const sumMood = latest5Entries.reduce((acc, curr) => acc + curr.mood, 0);
    const sumSleep = latest5Entries.reduce((acc, curr) => acc + (curr.sleepHours || 0), 0);
    latestAvgMood = Number((sumMood / latestCount).toFixed(2));
    latestAvgSleep = Number((sumSleep / latestCount).toFixed(2));
  }

  let previousAvgMood = null;
  let previousAvgSleep = null;
  if (previousCount > 0) {
    const sumMood = previous5Entries.reduce((acc, curr) => acc + curr.mood, 0);
    const sumSleep = previous5Entries.reduce((acc, curr) => acc + (curr.sleepHours || 0), 0);
    previousAvgMood = Number((sumMood / previousCount).toFixed(2));
    previousAvgSleep = Number((sumSleep / previousCount).toFixed(2));
  }

  // Calculate percentage changes if previous comparison period data is available
  let moodChangePercent = null;
  let sleepChangePercent = null;
  const hasComparisonData = Boolean(previousCount > 0 && previousAvgMood !== null && previousAvgSleep !== null);

  if (hasComparisonData && previousAvgMood > 0) {
    moodChangePercent = Number((((latestAvgMood - previousAvgMood) / previousAvgMood) * 100).toFixed(1));
  }

  if (hasComparisonData && previousAvgSleep > 0) {
    sleepChangePercent = Number((((latestAvgSleep - previousAvgSleep) / previousAvgSleep) * 100).toFixed(1));
  }

  return {
    latest5: {
      count: latestCount,
      averageMood: latestAvgMood,
      averageSleep: latestAvgSleep
    },
    previous5: {
      count: previousCount,
      averageMood: previousAvgMood,
      averageSleep: previousAvgSleep
    },
    comparison: {
      hasComparisonData,
      moodChangePercent,
      sleepChangePercent,
      isMoodImproving: moodChangePercent !== null ? moodChangePercent > 0 : null,
      isSleepImproving: sleepChangePercent !== null ? sleepChangePercent > 0 : null
    }
  };
};

/**
 * 3. GET /api/analytics/trends
 * Generate time-series data across date ranges (7d, 30d, 90d, 180d, 365d)
 * Missing dates are populated with null data points so time gaps are accurately represented.
 * @param {string} userId
 * @param {number} days
 */
const getTrends = async (userId, days = 30) => {
  const intervalDays = Math.max(days - 1, 0);

  // Generate calendar sequence from (today - intervalDays) to today in UTC
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const startUTC = new Date(todayUTC);
  startUTC.setUTCDate(startUTC.getUTCDate() - intervalDays);

  // Fetch entries in range
  const entries = await MoodEntry.find({
    userId,
    entryDate: { $gte: startUTC, $lte: todayUTC }
  }).sort({ entryDate: 1 });

  // Map entries by YYYY-MM-DD
  const entryMap = new Map();
  entries.forEach((e) => {
    const dStr = formatDateStr(e.entryDate);
    entryMap.set(dStr, e);
  });

  // Construct continuous calendar array
  const points = [];
  let recordedMoodSum = 0;
  let recordedSleepSum = 0;
  let loggedDays = 0;

  const currentIter = new Date(startUTC);
  while (currentIter <= todayUTC) {
    const dateStr = currentIter.toISOString().split('T')[0];
    const entry = entryMap.get(dateStr);

    if (entry) {
      recordedMoodSum += entry.mood;
      recordedSleepSum += (entry.sleepHours || 0);
      loggedDays += 1;

      points.push({
        date: dateStr,
        mood: entry.mood,
        sleepHours: entry.sleepHours,
        hasEntry: true
      });
    } else {
      points.push({
        date: dateStr,
        mood: null,
        sleepHours: null,
        hasEntry: false
      });
    }

    currentIter.setUTCDate(currentIter.getUTCDate() + 1);
  }

  const periodDays = points.length;
  const missingDays = periodDays - loggedDays;
  const averageMood = loggedDays > 0 ? Number((recordedMoodSum / loggedDays).toFixed(2)) : null;
  const averageSleep = loggedDays > 0 ? Number((recordedSleepSum / loggedDays).toFixed(2)) : null;
  const completionRate = periodDays > 0 ? Number(((loggedDays / periodDays) * 100).toFixed(1)) : 0;

  return {
    rangeDays: days,
    periodDays,
    loggedDays,
    missingDays,
    completionRate,
    averageMood,
    averageSleep,
    points
  };
};

/**
 * 4. GET /api/analytics/streak
 * Calculate current streak, longest streak, and total check-in days
 * @param {string} userId
 */
const getStreakAnalytics = async (userId) => {
  // Retrieve distinct sorted entry dates in ascending order
  const entries = await MoodEntry.find({ userId })
    .select('entryDate')
    .sort({ entryDate: 1 });

  if (entries.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalCheckInDays: 0
    };
  }

  // Deduplicate dates by YYYY-MM-DD
  const uniqueDateStrs = Array.from(new Set(entries.map((e) => formatDateStr(e.entryDate))));
  const totalCheckInDays = uniqueDateStrs.length;

  let longestStreak = 0;
  let currentGroupStreak = 0;
  let prevDate = null;

  for (const dateStr of uniqueDateStrs) {
    const currentDate = new Date(dateStr + 'T00:00:00.000Z');

    if (!prevDate) {
      currentGroupStreak = 1;
    } else {
      const diffMs = currentDate.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentGroupStreak += 1;
      } else {
        currentGroupStreak = 1;
      }
    }

    if (currentGroupStreak > longestStreak) {
      longestStreak = currentGroupStreak;
    }

    prevDate = currentDate;
  }

  // Current streak: check if latest check-in is today or yesterday
  let currentStreak = 0;
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const yesterdayUTC = new Date(todayUTC);
  yesterdayUTC.setUTCDate(yesterdayUTC.getUTCDate() - 1);

  const lastEntryDateStr = uniqueDateStrs[uniqueDateStrs.length - 1];
  const lastEntryDate = new Date(lastEntryDateStr + 'T00:00:00.000Z');

  if (lastEntryDate.getTime() === todayUTC.getTime() || lastEntryDate.getTime() === yesterdayUTC.getTime()) {
    let expectedDate = new Date(lastEntryDate);
    const dateSet = new Set(uniqueDateStrs);

    while (dateSet.has(expectedDate.toISOString().split('T')[0])) {
      currentStreak += 1;
      expectedDate.setUTCDate(expectedDate.getUTCDate() - 1);
    }
  }

  return {
    currentStreak,
    longestStreak,
    totalCheckInDays
  };
};

/**
 * 5. GET /api/analytics/calendar
 * Return mood entries grouped by date for monthly/annual calendar visualization.
 * @param {string} userId
 * @param {number} year
 * @param {number} month (1-12)
 */
const getCalendarData = async (userId, year, month) => {
  // Start and end dates for the given calendar month in UTC
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const rows = await MoodEntry.find({
    userId,
    entryDate: { $gte: startDate, $lte: endDate }
  }).sort({ entryDate: 1 });

  // Build grouped dictionary by date key for O(1) calendar cell rendering
  const entriesByDate = {};
  const entries = rows.map((r) => {
    const dateStr = formatDateStr(r.entryDate);
    const hasReflection = Boolean(r.reflection && r.reflection.trim().length > 0);
    const item = {
      id: r._id ? r._id.toString() : r.id,
      date: dateStr,
      mood: r.mood,
      sleepHours: r.sleepHours,
      feelings: r.feelings || [],
      reflection: r.reflection || '',
      hasReflection
    };
    entriesByDate[dateStr] = item;
    return item;
  });

  return {
    year,
    month,
    totalEntries: entries.length,
    entries,
    entriesByDate
  };
};

module.exports = {
  getRecentAnalytics,
  getComparisonSummary,
  getTrends,
  getStreakAnalytics,
  getCalendarData
};
