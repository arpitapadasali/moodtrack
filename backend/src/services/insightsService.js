const { MoodEntry } = require('../models');

/**
 * Calculate Pearson correlation coefficient between two numeric arrays
 * @param {number[]} x - Mood scores
 * @param {number[]} y - Sleep hours
 * @returns {number|null} Pearson r between -1 and 1, or null if insufficient variance
 */
function calculatePearsonCorrelation(x, y) {
  const n = x.length;
  if (n < 5) return null;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);

  const sumX2 = x.reduce((a, b) => a + b * b, 0);
  const sumY2 = y.reduce((a, b) => a + b * b, 0);

  const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);

  const numerator = n * sumXY - sumX * sumY;
  const denomX = n * sumX2 - sumX * sumX;
  const denomY = n * sumY2 - sumY * sumY;

  const denominator = Math.sqrt(denomX * denomY);
  if (denominator === 0 || isNaN(denominator)) return 0;

  const r = numerator / denominator;
  return Number(r.toFixed(2));
}

/**
 * Calculate sample standard deviation
 * @param {number[]} values
 * @returns {number}
 */
function calculateStandardDeviation(values) {
  if (!values || values.length <= 1) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1);
  return Number(Math.sqrt(variance).toFixed(2));
}

/**
 * 1. Analyze Mood Trends
 * Compares latest 7 check-ins vs previous 7 check-ins
 */
async function analyzeMoodTrend(userId) {
  const entries = await MoodEntry.find({ userId })
    .sort({ entryDate: -1 })
    .limit(28)
    .select('mood entryDate');

  if (!entries || entries.length < 3) {
    return {
      hasEnoughData: false,
      message: 'More check-ins needed to determine directional mood trends.'
    };
  }

  const recent = entries.slice(0, 7).map((e) => e.mood);
  const previous = entries.slice(7, 14).map((e) => e.mood);

  const recentAvg = Number((recent.reduce((a, b) => a + b, 0) / recent.length).toFixed(2));
  const prevAvg = previous.length > 0 ? Number((previous.reduce((a, b) => a + b, 0) / previous.length).toFixed(2)) : null;

  let percentChange = null;
  let direction = 'stable';

  if (prevAvg !== null && prevAvg > 0) {
    percentChange = Number((((recentAvg - prevAvg) / prevAvg) * 100).toFixed(1));
    if (percentChange >= 5) direction = 'improving';
    else if (percentChange <= -5) direction = 'declining';
  }

  // Low mood frequency (proportion of 1-2 scores)
  const allMoods = entries.map((e) => e.mood);
  const lowCount = allMoods.filter((m) => m <= 2).length;
  const highCount = allMoods.filter((m) => m >= 4).length;
  const lowFrequencyRate = Number(((lowCount / allMoods.length) * 100).toFixed(1));
  const highFrequencyRate = Number(((highCount / allMoods.length) * 100).toFixed(1));

  return {
    hasEnoughData: true,
    recentCount: recent.length,
    recentAvg,
    prevAvg,
    percentChange,
    direction,
    lowFrequencyRate,
    highFrequencyRate
  };
}

/**
 * 2. Analyze Sleep Trends & Consistency
 */
async function analyzeSleepTrend(userId) {
  const entries = await MoodEntry.find({ userId })
    .sort({ entryDate: -1 })
    .limit(28)
    .select('sleepHours entryDate');

  if (!entries || entries.length < 3) {
    return {
      hasEnoughData: false,
      message: 'More check-ins needed to analyze sleep patterns.'
    };
  }

  const recent = entries.slice(0, 7).map((e) => e.sleepHours);
  const previous = entries.slice(7, 14).map((e) => e.sleepHours);

  const recentAvg = Number((recent.reduce((a, b) => a + b, 0) / recent.length).toFixed(1));
  const prevAvg = previous.length > 0 ? Number((previous.reduce((a, b) => a + b, 0) / previous.length).toFixed(1)) : null;

  const recentStdDev = calculateStandardDeviation(recent);
  const prevStdDev = previous.length > 1 ? calculateStandardDeviation(previous) : null;

  let consistencyStatus = 'neutral';
  if (prevStdDev !== null) {
    if (recentStdDev <= prevStdDev - 0.3) {
      consistencyStatus = 'more_consistent';
    } else if (recentStdDev >= prevStdDev + 0.5) {
      consistencyStatus = 'less_consistent';
    }
  }

  return {
    hasEnoughData: true,
    recentAvg,
    prevAvg,
    recentStdDev,
    prevStdDev,
    consistencyStatus
  };
}

/**
 * 3. Analyze Mood & Sleep Correlation
 */
async function analyzeMoodSleepCorrelation(userId) {
  const entries = await MoodEntry.find({ userId })
    .sort({ entryDate: -1 })
    .limit(60)
    .select('mood sleepHours');

  if (!entries || entries.length < 5) {
    return {
      hasEnoughData: false,
      dataPoints: entries ? entries.length : 0,
      message: 'At least 5 to 7 recorded entries are required to evaluate statistical correlation.'
    };
  }

  const moods = entries.map((e) => e.mood);
  const sleeps = entries.map((e) => e.sleepHours);

  const r = calculatePearsonCorrelation(moods, sleeps);

  // Compare average mood on 7+ hours sleep days vs < 7 hours days
  const goodSleepDays = entries.filter((e) => e.sleepHours >= 7);
  const lowSleepDays = entries.filter((e) => e.sleepHours < 7);

  const avgMoodGoodSleep = goodSleepDays.length > 0
    ? Number((goodSleepDays.reduce((sum, e) => sum + e.mood, 0) / goodSleepDays.length).toFixed(2))
    : null;

  const avgMoodLowSleep = lowSleepDays.length > 0
    ? Number((lowSleepDays.reduce((sum, e) => sum + e.mood, 0) / lowSleepDays.length).toFixed(2))
    : null;

  let relationship = 'none';
  if (r !== null) {
    if (r >= 0.3) relationship = 'positive';
    else if (r <= -0.3) relationship = 'negative';
  }

  return {
    hasEnoughData: true,
    dataPoints: entries.length,
    correlationCoefficient: r,
    relationship,
    avgMoodGoodSleep,
    avgMoodLowSleep,
    goodSleepCount: goodSleepDays.length,
    lowSleepCount: lowSleepDays.length
  };
}

/**
 * 4. Analyze Streak & Consistency Patterns
 */
async function analyzeStreaks(userId) {
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

  const uniqueDateStrs = Array.from(new Set(entries.map((e) => e.entryDate.toISOString().split('T')[0])));
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
}

/**
 * 5. Analyze Missing-Day and Weekday Patterns
 */
async function analyzeMissingDayPatterns(userId) {
  const entries = await MoodEntry.find({ userId }).select('entryDate');

  const totalEntries = entries.length;
  if (totalEntries < 7) {
    return {
      hasEnoughData: false,
      message: 'At least 7 check-ins across multiple weeks are required to detect missing day patterns.'
    };
  }

  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dowCounts = Array(7).fill(0);

  entries.forEach((e) => {
    const dow = new Date(e.entryDate).getUTCDay();
    dowCounts[dow] += 1;
  });

  // Calculate weekday vs weekend totals
  const weekendCount = dowCounts[0] + dowCounts[6]; // Sun + Sat
  const weekdayCount = dowCounts[1] + dowCounts[2] + dowCounts[3] + dowCounts[4] + dowCounts[5];

  const weekdayAvg = weekdayCount / 5;
  const weekendAvg = weekendCount / 2;

  // Identify day with lowest logged check-ins
  let lowestDayIndex = 0;
  let lowestDayCount = dowCounts[0];
  let highestDayIndex = 0;
  let highestDayCount = dowCounts[0];

  for (let i = 1; i < 7; i++) {
    if (dowCounts[i] < lowestDayCount) {
      lowestDayCount = dowCounts[i];
      lowestDayIndex = i;
    }
    if (dowCounts[i] > highestDayCount) {
      highestDayCount = dowCounts[i];
      highestDayIndex = i;
    }
  }

  return {
    hasEnoughData: true,
    countsByDay: DAY_NAMES.map((name, i) => ({ day: name, count: dowCounts[i] })),
    mostConsistentDay: DAY_NAMES[highestDayIndex],
    mostMissedDay: DAY_NAMES[lowestDayIndex],
    isWeekendLower: weekendAvg < weekdayAvg * 0.75
  };
}

/**
 * Generate Complete Formatted Rule-Based Insights
 * Uses neutral non-clinical wording ("Your recorded data shows...", "Your entries suggest...")
 * @param {string} userId
 */
async function generateInsights(userId) {
  const [moodTrend, sleepTrend, correlation, streaks, missingDays] = await Promise.all([
    analyzeMoodTrend(userId),
    analyzeSleepTrend(userId),
    analyzeMoodSleepCorrelation(userId),
    analyzeStreaks(userId),
    analyzeMissingDayPatterns(userId)
  ]);

  const insights = [];

  // Insight 1: Mood Trend (Improvement, Decline, or High/Low Frequency)
  if (moodTrend.hasEnoughData) {
    if (moodTrend.direction === 'improving') {
      insights.push({
        id: 'mood-improving',
        category: 'mood',
        type: 'positive',
        title: 'Upward Mood Trajectory',
        description: `Your entries suggest your mood has improved over the last 7 days, averaging ${moodTrend.recentAvg}/5 compared to ${moodTrend.prevAvg}/5 in the preceding check-ins (+${moodTrend.percentChange}%).`,
        metric: `+${moodTrend.percentChange}% vs prior period`,
        confidence: 'high'
      });
    } else if (moodTrend.direction === 'declining') {
      insights.push({
        id: 'mood-declining',
        category: 'mood',
        type: 'caution',
        title: 'Recent Mood Dip',
        description: `Your recorded data indicates your mood scores have tended to be lower over the last 7 days, averaging ${moodTrend.recentAvg}/5 compared to ${moodTrend.prevAvg}/5 previously (${moodTrend.percentChange}%).`,
        metric: `${moodTrend.percentChange}% vs prior period`,
        confidence: 'high'
      });
    }

    if (moodTrend.lowFrequencyRate >= 35) {
      insights.push({
        id: 'mood-frequent-low',
        category: 'mood',
        type: 'info',
        title: 'Frequent Lower Mood Entries',
        description: `Your recorded data shows that ${moodTrend.lowFrequencyRate}% of recent entries reflect lower mood scores (1–2). Reviewing your daily reflections on those dates may highlight recurring circumstances.`,
        metric: `${moodTrend.lowFrequencyRate}% low scores`,
        confidence: 'medium'
      });
    } else if (moodTrend.highFrequencyRate >= 60) {
      insights.push({
        id: 'mood-frequent-high',
        category: 'mood',
        type: 'positive',
        title: 'Predominantly Positive States',
        description: `Your entries suggest consistent positive wellbeing, with ${moodTrend.highFrequencyRate}% of recorded days rated Good or Excellent (4–5).`,
        metric: `${moodTrend.highFrequencyRate}% positive days`,
        confidence: 'high'
      });
    }
  }

  // Insight 2: Sleep & Mood Correlation
  if (correlation.hasEnoughData) {
    if (correlation.relationship === 'positive' && correlation.avgMoodGoodSleep !== null && correlation.avgMoodLowSleep !== null) {
      insights.push({
        id: 'correlation-positive',
        category: 'correlation',
        type: 'positive',
        title: 'Rest & Mood Connection',
        description: `Your recorded data shows that mood tends to be higher on days with 7+ hours of sleep (averaging ${correlation.avgMoodGoodSleep}/5 vs ${correlation.avgMoodLowSleep}/5 on shorter rest nights).`,
        metric: `+${Number((correlation.avgMoodGoodSleep - correlation.avgMoodLowSleep).toFixed(1))} mood pts on 7h+ sleep`,
        correlationScore: correlation.correlationCoefficient,
        confidence: 'high'
      });
    } else if (correlation.relationship === 'negative') {
      insights.push({
        id: 'correlation-negative',
        category: 'correlation',
        type: 'info',
        title: 'Sleep & Mood Inverse Tendency',
        description: `Your entries suggest an inverse correlation between sleep duration and mood ratings (r = ${correlation.correlationCoefficient}). Logging more reflection details may provide context.`,
        metric: `r = ${correlation.correlationCoefficient}`,
        confidence: 'medium'
      });
    } else {
      insights.push({
        id: 'correlation-neutral',
        category: 'correlation',
        type: 'neutral',
        title: 'Sleep Duration & Mood Independence',
        description: `Your recorded data shows little direct correlation between sleep duration and mood scores (r = ${correlation.correlationCoefficient}), suggesting daytime events and emotions play a more dominant role.`,
        metric: `r = ${correlation.correlationCoefficient} (Neutral)`,
        confidence: 'medium'
      });
    }
  }

  // Insight 3: Sleep Consistency & Duration
  if (sleepTrend.hasEnoughData) {
    if (sleepTrend.consistencyStatus === 'more_consistent') {
      insights.push({
        id: 'sleep-consistent',
        category: 'sleep',
        type: 'positive',
        title: 'Stabilizing Sleep Schedule',
        description: `Your recorded data shows sleep has become more consistent recently, with nightly variation narrowing compared to previous weeks.`,
        metric: `Avg ${sleepTrend.recentAvg}h (±${sleepTrend.recentStdDev}h)`,
        confidence: 'high'
      });
    } else if (sleepTrend.recentAvg < 6.5) {
      insights.push({
        id: 'sleep-short',
        category: 'sleep',
        type: 'caution',
        title: 'Rest Duration Under Baseline',
        description: `Your entries show your average sleep over recent days has averaged ${sleepTrend.recentAvg} hours per night, lower than recommended adult recovery benchmarks.`,
        metric: `${sleepTrend.recentAvg} hrs / night`,
        confidence: 'medium'
      });
    } else if (sleepTrend.recentAvg >= 7.0 && sleepTrend.recentAvg <= 9.0) {
      insights.push({
        id: 'sleep-optimal',
        category: 'sleep',
        type: 'positive',
        title: 'Optimal Sleep Duration',
        description: `Your entries show your nightly sleep duration has averaged ${sleepTrend.recentAvg} hours, aligning well with standard restorative rest guidelines.`,
        metric: `${sleepTrend.recentAvg} hrs / night`,
        confidence: 'high'
      });
    }
  }

  // Insight 4: Streak & Consistency Milestone
  if (streaks.currentStreak >= 3) {
    insights.push({
      id: 'streak-active',
      category: 'streak',
      type: 'positive',
      title: 'Active Check-in Momentum',
      description: `Your recorded data shows you have maintained an active check-in streak of ${streaks.currentStreak} consecutive days. Your all-time record is ${streaks.longestStreak} days.`,
      metric: `${streaks.currentStreak}-day streak`,
      confidence: 'high'
    });
  } else if (streaks.totalCheckInDays >= 10) {
    insights.push({
      id: 'streak-milestone',
      category: 'streak',
      type: 'neutral',
      title: 'Tracking Volume Milestone',
      description: `Your entries reflect a substantial dataset with ${streaks.totalCheckInDays} total days recorded, increasing the statistical value of your personal trends.`,
      metric: `${streaks.totalCheckInDays} total check-ins`,
      confidence: 'high'
    });
  }

  // Insight 5: Missing-Day Patterns
  if (missingDays.hasEnoughData) {
    if (missingDays.isWeekendLower) {
      insights.push({
        id: 'missing-weekends',
        category: 'habit',
        type: 'info',
        title: 'Weekend Tracking Pattern',
        description: `Your entries suggest you tend to miss check-ins more frequently on weekends compared to weekdays. A scheduled reminder on Saturdays and Sundays may help keep your streak uninterrupted.`,
        metric: 'Weekends lower check-in rate',
        confidence: 'medium'
      });
    } else if (missingDays.mostMissedDay) {
      insights.push({
        id: 'missing-day',
        category: 'habit',
        type: 'info',
        title: 'Weekly Logging Rhythm',
        description: `Your recorded data shows you are most consistent on ${missingDays.mostConsistentDay}s and have tended to miss check-ins most often on ${missingDays.mostMissedDay}s.`,
        metric: `Most missed: ${missingDays.mostMissedDay}`,
        confidence: 'medium'
      });
    }
  }

  const totalEntries = streaks.totalCheckInDays;

  return {
    totalEntries,
    insightsCount: insights.length,
    hasMinimumDataset: totalEntries >= 5,
    summaryHeadline:
      insights.length > 0
        ? `Generated ${insights.length} personalized wellness insights based on your ${totalEntries} check-in entries.`
        : 'Log at least 5 to 7 daily check-ins to generate personalized behavioral insights.',
    metrics: {
      moodTrend,
      sleepTrend,
      correlation,
      streaks,
      missingDays
    },
    insights
  };
}

module.exports = {
  calculatePearsonCorrelation,
  calculateStandardDeviation,
  analyzeMoodTrend,
  analyzeSleepTrend,
  analyzeMoodSleepCorrelation,
  analyzeStreaks,
  analyzeMissingDayPatterns,
  generateInsights
};
