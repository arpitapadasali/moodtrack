const { MoodEntry } = require('../models');

// Configurable ML service URL (default http://127.0.0.1:8000)
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
const REQUEST_TIMEOUT_MS = 5000;

/**
 * Send anonymized numerical payload to Python FastAPI service.
 * Handles timeouts and service downtime gracefully.
 * 
 * @param {Object} payload { entries: [...], recent_mood_values: [...], recent_sleep_values: [...] }
 * @returns {Promise<Object>} Structured prediction result or graceful fallback
 */
async function sendToMlService(payload) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      return {
        available: true,
        status: 'error',
        message: `ML service returned HTTP ${response.status}: ${errorText}`,
        insights: null
      };
    }

    const data = await response.json();
    return {
      available: true,
      ...data
    };
  } catch (error) {
    // Graceful fallback when the Python ML microservice is not running
    const isConnectionError =
      error.name === 'AbortError' ||
      error.code === 'ECONNREFUSED' ||
      error.message?.includes('fetch failed');

    return {
      available: false,
      status: 'service_unavailable',
      message: isConnectionError
        ? 'The optional Python Machine Learning service is currently offline or unreachable.'
        : `ML service request failed: ${error.message}`,
      min_required: 5,
      data_points_analyzed: payload.entries?.length || 0,
      disclaimer:
        'This service provides automated statistical pattern detection on anonymized numerical metrics. It is strictly observational and NOT a clinical or mental-health diagnostic tool.',
      insights: null
    };
  }
}

/**
 * Retrieve and prepare anonymized numerical mood data for authenticated user,
 * then request pattern detection from Python ML service.
 * 
 * @param {string} userId Authenticated user ID
 * @returns {Promise<Object>} ML prediction result
 */
async function getUserMlInsights(userId) {
  // 1. Fetch user's historical entries ordered chronologically
  const entries = await MoodEntry.find({ userId })
    .sort({ entryDate: 1 })
    .select('mood sleepHours entryDate');

  // 2. Anonymize and format as purely numerical records
  // Strictly numeric data: mood, sleep_hours, day_of_week, date string
  const anonymizedEntries = entries.map((entry) => {
    const dateObj = new Date(entry.entryDate);
    return {
      mood: Number(entry.mood),
      sleep_hours: Number(entry.sleepHours || 0),
      day_of_week: dateObj.getDay(), // 0=Sunday, 1=Monday, ..., 6=Saturday
      date: entry.entryDate.toISOString().split('T')[0]
    };
  });

  // 3. Extract recent arrays for convenience
  const recentMoodValues = anonymizedEntries.slice(-14).map((e) => e.mood);
  const recentSleepValues = anonymizedEntries.slice(-14).map((e) => e.sleep_hours);

  // 4. Dispatch to Python ML microservice
  return await sendToMlService({
    entries: anonymizedEntries,
    recent_mood_values: recentMoodValues,
    recent_sleep_values: recentSleepValues
  });
}

/**
 * Health check ping for the ML service
 */
async function checkMlServiceHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(`${ML_SERVICE_URL}/health`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return { available: true, ...data };
    }
    return { available: false, status: `HTTP ${response.status}` };
  } catch (error) {
    return { available: false, status: 'offline', error: error.message };
  }
}

module.exports = {
  sendToMlService,
  getUserMlInsights,
  checkMlServiceHealth,
  ML_SERVICE_URL
};
