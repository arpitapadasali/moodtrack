/**
 * Weather Analytics Service for MoodTrack.
 * 
 * Computes statistical correlations and descriptive breakdowns between
 * recorded mood scores and weather variables:
 * - mood vs temperature
 * - mood vs weather condition
 * - mood vs precipitation
 * 
 * Strict Ethical & Analytical Guardrails:
 * - Requires at least 5 check-ins with weather data before rendering correlations.
 * - Prominently and unequivocally clarifies that correlation does NOT imply causation.
 * - Uses neutral, descriptive language without clinical assertions.
 */

const { MoodEntry } = require('../models');

const MIN_WEATHER_ENTRIES = 5;
const CORRELATION_CAUSATION_DISCLAIMER =
  'Statistical correlation does not establish causation. Observed associations between weather variables and mood scores reflect co-occurrence in your personal records and do not indicate that weather directly caused mood changes.';

/**
 * Calculate Pearson correlation coefficient between two numeric arrays
 */
function calculatePearsonR(xArr, yArr) {
  const n = xArr.length;
  if (n < 3) return 0.0;

  const xMean = xArr.reduce((a, b) => a + b, 0) / n;
  const yMean = yArr.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let xDenom = 0;
  let yDenom = 0;

  for (let i = 0; i < n; i++) {
    const xDiff = xArr[i] - xMean;
    const yDiff = yArr[i] - yMean;
    numerator += xDiff * yDiff;
    xDenom += xDiff * xDiff;
    yDenom += yDiff * yDiff;
  }

  const denominator = Math.sqrt(xDenom * yDenom);
  if (denominator <= 1e-6) return 0.0;

  return Math.round((numerator / denominator) * 100) / 100;
}

/**
 * Analyze Mood vs Temperature
 */
function analyzeMoodVsTemperature(entriesWithTemp) {
  const n = entriesWithTemp.length;
  if (n === 0) return null;

  const temps = entriesWithTemp.map((e) => e.temperature);
  const moods = entriesWithTemp.map((e) => e.mood);

  const r = calculatePearsonR(temps, moods);

  // Group into temperature bands (Celsius)
  // Cool: < 15°C, Mild: 15°C - 24°C, Warm: >= 25°C
  const bands = {
    cool: { label: 'Cool (< 15°C)', count: 0, sumMood: 0, avgMood: null },
    mild: { label: 'Mild (15°C – 24°C)', count: 0, sumMood: 0, avgMood: null },
    warm: { label: 'Warm (≥ 25°C)', count: 0, sumMood: 0, avgMood: null }
  };

  entriesWithTemp.forEach((e) => {
    const t = e.temperature;
    if (t < 15) {
      bands.cool.count += 1;
      bands.cool.sumMood += e.mood;
    } else if (t <= 24) {
      bands.mild.count += 1;
      bands.mild.sumMood += e.mood;
    } else {
      bands.warm.count += 1;
      bands.warm.sumMood += e.mood;
    }
  });

  Object.keys(bands).forEach((k) => {
    if (bands[k].count > 0) {
      bands[k].avgMood = Math.round((bands[k].sumMood / bands[k].count) * 10) / 10;
    }
  });

  let relationshipType = 'neutral';
  let desc = `Your entries show little to no linear correlation (r = ${r}) between ambient temperature and mood scores.`;

  if (r >= 0.25) {
    relationshipType = 'positive';
    desc = `Your recorded entries show a positive statistical association (r = +${r}) where higher ambient temperatures coincided with higher recorded mood scores.`;
  } else if (r <= -0.25) {
    relationshipType = 'negative';
    desc = `Your recorded entries indicate an inverse statistical association (r = ${r}) where cooler ambient temperatures coincided with higher recorded mood scores.`;
  }

  return {
    sampleSize: n,
    correlationCoefficient: r,
    relationshipType,
    temperatureBands: Object.values(bands),
    description: desc
  };
}

/**
 * Analyze Mood vs Weather Condition
 */
function analyzeMoodVsCondition(entriesWithCond) {
  const n = entriesWithCond.length;
  if (n === 0) return null;

  const conditionMap = {};

  entriesWithCond.forEach((e) => {
    const cond = e.weatherCondition || 'Unknown';
    if (!conditionMap[cond]) {
      conditionMap[cond] = { condition: cond, count: 0, sumMood: 0, avgMood: null, percentage: 0 };
    }
    conditionMap[cond].count += 1;
    conditionMap[cond].sumMood += e.mood;
  });

  const breakdown = Object.values(conditionMap).map((item) => ({
    ...item,
    avgMood: Math.round((item.sumMood / item.count) * 10) / 10,
    percentage: Math.round((item.count / n) * 100)
  }));

  // Sort by highest average mood
  breakdown.sort((a, b) => b.avgMood - a.avgMood);

  let desc = `Evaluated ${breakdown.length} distinct recorded weather condition(s).`;
  if (breakdown.length >= 2) {
    const highest = breakdown[0];
    const lowest = breakdown[breakdown.length - 1];
    desc = `Recorded mood averaged highest during "${highest.condition}" conditions (${highest.avgMood}/5 across ${highest.count} entries), and lowest during "${lowest.condition}" conditions (${lowest.avgMood}/5 across ${lowest.count} entries).`;
  }

  return {
    sampleSize: n,
    conditionBreakdown: breakdown,
    description: desc
  };
}

/**
 * Analyze Mood vs Precipitation
 */
function analyzeMoodVsPrecipitation(entriesWithPrecip) {
  const n = entriesWithPrecip.length;
  if (n === 0) return null;

  const precips = entriesWithPrecip.map((e) => e.precipitation || 0);
  const moods = entriesWithPrecip.map((e) => e.mood);

  const r = calculatePearsonR(precips, moods);

  let dryCount = 0;
  let drySumMood = 0;
  let wetCount = 0;
  let wetSumMood = 0;

  entriesWithPrecip.forEach((e) => {
    const p = e.precipitation || 0;
    if (p > 0.05) {
      wetCount += 1;
      wetSumMood += e.mood;
    } else {
      dryCount += 1;
      drySumMood += e.mood;
    }
  });

  const dryAvgMood = dryCount > 0 ? Math.round((drySumMood / dryCount) * 10) / 10 : null;
  const wetAvgMood = wetCount > 0 ? Math.round((wetSumMood / wetCount) * 10) / 10 : null;

  let desc = 'Not enough contrast between dry and precipitation days to compare averages.';
  if (dryCount >= 2 && wetCount >= 2 && dryAvgMood !== null && wetAvgMood !== null) {
    const diff = Math.round((dryAvgMood - wetAvgMood) * 10) / 10;
    if (Math.abs(diff) >= 0.2) {
      desc = `Dry days averaged ${dryAvgMood}/5 mood (${dryCount} days), whereas precipitation days averaged ${wetAvgMood}/5 mood (${wetCount} days), a difference of ${Math.abs(diff)} points.`;
    } else {
      desc = `Recorded mood showed little divergence between dry days (${dryAvgMood}/5) and days with precipitation (${wetAvgMood}/5).`;
    }
  }

  return {
    sampleSize: n,
    correlationCoefficient: r,
    dryDays: { count: dryCount, avgMood: dryAvgMood },
    precipitationDays: { count: wetCount, avgMood: wetAvgMood },
    description: desc
  };
}

/**
 * Main analytics endpoint query
 * GET /api/analytics/weather
 * @param {string} userId
 */
const getWeatherAnalytics = async (userId) => {
  // Query all entries for the user where at least one weather metric is recorded
  const entries = await MoodEntry.find({
    userId,
    $or: [
      { temperature: { $ne: null } },
      { weatherCondition: { $ne: null } },
      { precipitation: { $ne: null } }
    ]
  })
    .sort({ entryDate: 1 })
    .select('entryDate mood temperature weatherCondition precipitation');

  const totalEntries = entries.length;

  // Strict guard: Only display correlation when enough data exists (>= 5 entries)
  if (totalEntries < MIN_WEATHER_ENTRIES) {
    return {
      hasEnoughData: false,
      totalWeatherEntries: totalEntries,
      minEntriesRequired: MIN_WEATHER_ENTRIES,
      message: `Insufficient weather data for statistical analysis. You have ${totalEntries} check-in(s) with weather recorded, but at least ${MIN_WEATHER_ENTRIES} entries are required to calculate meaningful correlations without misleading extrapolation.`,
      disclaimer: CORRELATION_CAUSATION_DISCLAIMER,
      temperatureAnalytics: null,
      conditionAnalytics: null,
      precipitationAnalytics: null
    };
  }

  // Segment entries with specific measurements
  const withTemp = entries.filter((e) => e.temperature !== null && e.temperature !== undefined);
  const withCond = entries.filter((e) => e.weatherCondition && e.weatherCondition.trim().length > 0);
  const withPrecip = entries.filter((e) => e.precipitation !== null && e.precipitation !== undefined);

  const temperatureAnalytics = analyzeMoodVsTemperature(withTemp);
  const conditionAnalytics = analyzeMoodVsCondition(withCond);
  const precipitationAnalytics = analyzeMoodVsPrecipitation(withPrecip);

  return {
    hasEnoughData: true,
    totalWeatherEntries: totalEntries,
    minEntriesRequired: MIN_WEATHER_ENTRIES,
    disclaimer: CORRELATION_CAUSATION_DISCLAIMER,
    temperatureAnalytics,
    conditionAnalytics,
    precipitationAnalytics
  };
};

module.exports = {
  getWeatherAnalytics,
  analyzeMoodVsTemperature,
  analyzeMoodVsCondition,
  analyzeMoodVsPrecipitation,
  CORRELATION_CAUSATION_DISCLAIMER,
  MIN_WEATHER_ENTRIES
};
