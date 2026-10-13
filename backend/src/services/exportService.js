const { MoodEntry } = require('../models');

/**
 * Format entryDate into YYYY-MM-DD
 * @param {Date|string} dateVal
 * @returns {string}
 */
const formatDate = (dateVal) => {
  if (!dateVal) return '';
  if (typeof dateVal === 'string') return dateVal.split('T')[0];
  if (dateVal instanceof Date) return dateVal.toISOString().split('T')[0];
  return String(dateVal);
};

/**
 * Escape and format a value for RFC 4180 CSV compliance
 * @param {any} val
 * @returns {string}
 */
const escapeCsvValue = (val) => {
  if (val === null || val === undefined) return '';
  const str = String(val);
  // RFC 4180: If value contains double quote, comma, or newline, escape inner quotes and wrap in quotes
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Fetch all mood entries for the authenticated user, strictly scoped by userId.
 * Never fetches passwords, tokens, or other users' data.
 * @param {string} userId
 * @returns {Promise<Array>}
 */
const getUserMoodEntries = async (userId) => {
  return MoodEntry.find({ userId })
    .sort({ entryDate: 1 })
    .select('entryDate mood feelings reflection sleepHours temperature weatherCondition precipitation');
};

/**
 * Format mood records into JSON export structure
 * @param {Array} entries
 * @returns {Array<Object>}
 */
const formatJsonExport = (entries) => {
  return entries.map((entry) => {
    const item = {
      date: formatDate(entry.entryDate),
      mood: entry.mood,
      feelings: Array.isArray(entry.feelings) ? entry.feelings : [],
      reflection: entry.reflection || '',
      sleepHours: entry.sleepHours
    };

    // Include optional weather information if recorded
    if (entry.temperature !== null && entry.temperature !== undefined) {
      item.temperature = entry.temperature;
    }
    if (entry.weatherCondition) {
      item.weatherCondition = entry.weatherCondition;
    }
    if (entry.precipitation !== null && entry.precipitation !== undefined) {
      item.precipitation = entry.precipitation;
    }

    return item;
  });
};

/**
 * Format mood records into clean RFC 4180 CSV tabular representation
 * @param {Array} entries
 * @returns {string}
 */
const formatCsvExport = (entries) => {
  const headers = [
    'date',
    'mood',
    'sleepHours',
    'feelings',
    'reflection',
    'temperature',
    'weatherCondition',
    'precipitation'
  ];

  const rows = entries.map((entry) => {
    const feelingsStr = Array.isArray(entry.feelings) ? entry.feelings.join(', ') : '';
    const tempStr = entry.temperature !== null && entry.temperature !== undefined ? entry.temperature : '';
    const precipStr = entry.precipitation !== null && entry.precipitation !== undefined ? entry.precipitation : '';

    return [
      escapeCsvValue(formatDate(entry.entryDate)),
      escapeCsvValue(entry.mood),
      escapeCsvValue(entry.sleepHours),
      escapeCsvValue(feelingsStr),
      escapeCsvValue(entry.reflection || ''),
      escapeCsvValue(tempStr),
      escapeCsvValue(entry.weatherCondition || ''),
      escapeCsvValue(precipStr)
    ].join(',');
  });

  // Prepend UTF-8 BOM (\uFEFF) for seamless Microsoft Excel and Google Sheets encoding
  return '\uFEFF' + [headers.join(','), ...rows].join('\r\n') + '\r\n';
};

module.exports = {
  getUserMoodEntries,
  formatJsonExport,
  formatCsvExport,
  formatDate,
  escapeCsvValue
};
