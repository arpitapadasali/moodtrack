const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const { User, MoodEntry } = require('../src/models');
const { generateToken } = require('../src/utils/jwtHelper');
const {
  calculatePearsonCorrelation,
  calculateStandardDeviation
} = require('../src/services/insightsService');
const {
  analyzeMoodVsTemperature,
  analyzeMoodVsCondition,
  analyzeMoodVsPrecipitation,
  CORRELATION_CAUSATION_DISCLAIMER
} = require('../src/services/weatherAnalyticsService');

describe('Backend: Analytics & Trend Engine Suite', () => {
  const testUserId = '65432165432165432165432c';
  const testUser = {
    _id: testUserId,
    id: testUserId,
    name: 'Morgan Analyst',
    email: 'morgan@example.com'
  };

  const authToken = generateToken({ userId: testUser.id, email: testUser.email });

  beforeEach(() => {
    User.findById = (id) => ({
      select: () => Promise.resolve(testUser),
      then: (resolve) => resolve(testUser)
    });
  });

  describe('Edge Case 1: Zero Mood Entries (Empty Dataset)', () => {
    beforeEach(() => {
      MoodEntry.find = () => ({
        sort: (sortArg) => {
          const ret = Promise.resolve([]);
          ret.select = () => Promise.resolve([]);
          ret.limit = () => Promise.resolve([]);
          return ret;
        },
        select: () => ({
          sort: () => Promise.resolve([])
        })
      });
    });

    it('handles 0 entries in comparison summary gracefully without division-by-zero', async () => {
      const res = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', `Bearer ${authToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.latest5.count, 0);
      assert.strictEqual(res.body.data.latest5.averageMood, null);
      assert.strictEqual(res.body.data.previous5.count, 0);
      assert.strictEqual(res.body.data.comparison.hasComparisonData, false);
      assert.strictEqual(res.body.data.comparison.moodChangePercent, null);
    });

    it('handles 0 entries in trends with all dates marked hasEntry: false and null averages', async () => {
      const res = await request(app)
        .get('/api/analytics/trends?days=7')
        .set('Authorization', `Bearer ${authToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.loggedDays, 0);
      assert.strictEqual(res.body.data.periodDays, 7);
      assert.strictEqual(res.body.data.missingDays, 7);
      assert.strictEqual(res.body.data.completionRate, 0);
      assert.strictEqual(res.body.data.averageMood, null);
      assert.strictEqual(res.body.data.averageSleep, null);
      assert.ok(res.body.data.points.every((pt) => pt.hasEntry === false && pt.mood === null));
    });

    it('handles 0 entries in streak analytics', async () => {
      const res = await request(app)
        .get('/api/analytics/streak')
        .set('Authorization', `Bearer ${authToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.currentStreak, 0);
      assert.strictEqual(res.body.data.longestStreak, 0);
      assert.strictEqual(res.body.data.totalCheckInDays, 0);
    });

    it('handles 0 entries in weather analytics with clear insufficient data response', async () => {
      const res = await request(app)
        .get('/api/analytics/weather')
        .set('Authorization', `Bearer ${authToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.hasEnoughData, false);
      assert.strictEqual(res.body.data.totalWeatherEntries, 0);
      assert.strictEqual(res.body.data.minEntriesRequired, 5);
      assert.match(res.body.data.message, /at least 5 entries are required/i);
      assert.strictEqual(res.body.data.disclaimer, CORRELATION_CAUSATION_DISCLAIMER);
    });
  });

  describe('Edge Case 2: Exactly One Mood Entry (1 entry)', () => {
    beforeEach(() => {
      const singleEntry = {
        id: 'single-1',
        entryDate: new Date(),
        mood: 4,
        sleepHours: 7.5,
        temperature: 20,
        weatherCondition: 'Cloudy',
        precipitation: 0
      };

      MoodEntry.find = () => ({
        sort: () => ({
          limit: () => Promise.resolve([singleEntry]),
          select: () => Promise.resolve([singleEntry])
        }),
        select: () => ({
          sort: () => Promise.resolve([singleEntry])
        })
      });
    });

    it('computes latest 1 entry without comparison data', async () => {
      const res = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', `Bearer ${authToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.latest5.count, 1);
      assert.strictEqual(res.body.data.latest5.averageMood, 4.0);
      assert.strictEqual(res.body.data.latest5.averageSleep, 7.5);
      assert.strictEqual(res.body.data.previous5.count, 0);
      assert.strictEqual(res.body.data.comparison.hasComparisonData, false);
    });

    it('marks weather analytics hasEnoughData: false with 1 entry', async () => {
      const res = await request(app)
        .get('/api/analytics/weather')
        .set('Authorization', `Bearer ${authToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.hasEnoughData, false);
      assert.strictEqual(res.body.data.totalWeatherEntries, 1);
    });
  });

  describe('Edge Case 3: Exactly Five Entries (5 entries)', () => {
    const fiveEntries = [
      { id: 'e1', entryDate: new Date('2026-03-01'), mood: 4, sleepHours: 7.0, temperature: 18, weatherCondition: 'Clear', precipitation: 0 },
      { id: 'e2', entryDate: new Date('2026-03-02'), mood: 3, sleepHours: 6.5, temperature: 14, weatherCondition: 'Rain', precipitation: 5.2 },
      { id: 'e3', entryDate: new Date('2026-03-03'), mood: 5, sleepHours: 8.0, temperature: 26, weatherCondition: 'Sunny', precipitation: 0 },
      { id: 'e4', entryDate: new Date('2026-03-04'), mood: 4, sleepHours: 7.5, temperature: 22, weatherCondition: 'Clear', precipitation: 0 },
      { id: 'e5', entryDate: new Date('2026-03-05'), mood: 3, sleepHours: 7.0, temperature: 12, weatherCondition: 'Rain', precipitation: 8.0 }
    ];

    beforeEach(() => {
      MoodEntry.find = () => ({
        sort: () => ({
          limit: () => Promise.resolve(fiveEntries),
          select: () => Promise.resolve(fiveEntries)
        }),
        select: () => ({
          sort: () => Promise.resolve(fiveEntries)
        })
      });
    });

    it('correctly calculates 5 latest check-ins while previous5 remains empty', async () => {
      const res = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', `Bearer ${authToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.latest5.count, 5);
      // (4 + 3 + 5 + 4 + 3) / 5 = 3.8
      assert.strictEqual(res.body.data.latest5.averageMood, 3.8);
      assert.strictEqual(res.body.data.previous5.count, 0);
      assert.strictEqual(res.body.data.comparison.hasComparisonData, false);
    });

    it('enables weather correlation analytics once 5 entries are recorded', async () => {
      const res = await request(app)
        .get('/api/analytics/weather')
        .set('Authorization', `Bearer ${authToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.hasEnoughData, true);
      assert.strictEqual(res.body.data.totalWeatherEntries, 5);
      assert.ok(res.body.data.temperatureAnalytics);
      assert.ok(res.body.data.conditionAnalytics);
      assert.ok(res.body.data.precipitationAnalytics);
      assert.strictEqual(res.body.data.disclaimer, CORRELATION_CAUSATION_DISCLAIMER);
    });
  });

  describe('Edge Case 4: Exactly Ten Entries (10 entries: 5 latest vs 5 previous)', () => {
    beforeEach(() => {
      const tenEntries = [
        // latest 5: avg mood = (5+4+5+4+4)/5 = 4.4, avg sleep = (8+8+8+8+8)/5 = 8.0
        { id: 'e1', entryDate: new Date('2026-03-10'), mood: 5, sleepHours: 8.0 },
        { id: 'e2', entryDate: new Date('2026-03-09'), mood: 4, sleepHours: 8.0 },
        { id: 'e3', entryDate: new Date('2026-03-08'), mood: 5, sleepHours: 8.0 },
        { id: 'e4', entryDate: new Date('2026-03-07'), mood: 4, sleepHours: 8.0 },
        { id: 'e5', entryDate: new Date('2026-03-06'), mood: 4, sleepHours: 8.0 },
        // previous 5: avg mood = (3+3+4+3+3)/5 = 3.2, avg sleep = (6+7+7+6+6.5)/5 = 6.5
        { id: 'e6', entryDate: new Date('2026-03-05'), mood: 3, sleepHours: 6.0 },
        { id: 'e7', entryDate: new Date('2026-03-04'), mood: 3, sleepHours: 7.0 },
        { id: 'e8', entryDate: new Date('2026-03-03'), mood: 4, sleepHours: 7.0 },
        { id: 'e9', entryDate: new Date('2026-03-02'), mood: 3, sleepHours: 6.0 },
        { id: 'e10', entryDate: new Date('2026-03-01'), mood: 3, sleepHours: 6.5 }
      ];

      MoodEntry.find = () => ({
        sort: () => ({
          limit: () => Promise.resolve(tenEntries)
        })
      });
    });

    it('computes 5-vs-5 comparison and percentage change between periods', async () => {
      const res = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', `Bearer ${authToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.latest5.count, 5);
      assert.strictEqual(res.body.data.previous5.count, 5);
      assert.strictEqual(res.body.data.comparison.hasComparisonData, true);

      // (4.4 - 3.2) / 3.2 * 100 = +37.5%
      assert.strictEqual(res.body.data.comparison.moodChangePercent, 37.5);
      assert.strictEqual(res.body.data.comparison.isMoodImproving, true);

      // (8.0 - 6.5) / 6.5 * 100 = +23.1%
      assert.strictEqual(res.body.data.comparison.sleepChangePercent, 23.1);
      assert.strictEqual(res.body.data.comparison.isSleepImproving, true);
    });
  });

  describe('Edge Case 5: Missing Dates in Time-Series Trends', () => {
    beforeEach(() => {
      const now = new Date();
      const getUtcDate = (daysAgo) => {
        const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        d.setUTCDate(d.getUTCDate() - daysAgo);
        return d;
      };

      // 3 recorded days out of 7
      const recordedEntries = [
        { entryDate: getUtcDate(6), mood: 4, sleepHours: 7.0 },
        { entryDate: getUtcDate(4), mood: 5, sleepHours: 8.0 },
        { entryDate: getUtcDate(1), mood: 3, sleepHours: 6.0 }
      ];

      MoodEntry.find = () => ({
        sort: () => Promise.resolve(recordedEntries)
      });
    });

    it('correctly maps missing dates with hasEntry: false and excludes missing days from averages', async () => {
      const res = await request(app)
        .get('/api/analytics/trends?days=7')
        .set('Authorization', `Bearer ${authToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.periodDays, 7);
      assert.strictEqual(res.body.data.loggedDays, 3);
      assert.strictEqual(res.body.data.missingDays, 4);

      // (4 + 5 + 3) / 3 = 4.0
      assert.strictEqual(res.body.data.averageMood, 4.0);
      // (7 + 8 + 6) / 3 = 7.0
      assert.strictEqual(res.body.data.averageSleep, 7.0);

      // (3 / 7) * 100 = 42.9%
      assert.strictEqual(res.body.data.completionRate, 42.9);
      assert.strictEqual(res.body.data.points.length, 7);
    });
  });

  describe('Edge Cases 6 & 7: Consecutive vs Non-Consecutive Dates Streak Calculation', () => {
    it('handles consecutive streak calculation', async () => {
      const now = new Date();
      const getUtcDate = (daysAgo) => {
        const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        d.setUTCDate(d.getUTCDate() - daysAgo);
        return d;
      };

      // 7 consecutive days ending today
      const streakEntries = [];
      for (let i = 6; i >= 0; i--) {
        streakEntries.push({ entryDate: getUtcDate(i) });
      }

      MoodEntry.find = () => ({
        select: () => ({
          sort: () => Promise.resolve(streakEntries)
        })
      });

      const res = await request(app)
        .get('/api/analytics/streak')
        .set('Authorization', `Bearer ${authToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.currentStreak, 7);
      assert.strictEqual(res.body.data.longestStreak, 7);
      assert.strictEqual(res.body.data.totalCheckInDays, 7);
    });

    it('handles non-consecutive date gaps where streak resets', async () => {
      const now = new Date();
      const getUtcDate = (daysAgo) => {
        const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        d.setUTCDate(d.getUTCDate() - daysAgo);
        return d;
      };

      // Streak of 5 from days 10 to 6, then gap, then check-in today (streak 1)
      const gapEntries = [
        { entryDate: getUtcDate(10) },
        { entryDate: getUtcDate(9) },
        { entryDate: getUtcDate(8) },
        { entryDate: getUtcDate(7) },
        { entryDate: getUtcDate(6) },
        { entryDate: getUtcDate(0) } // today
      ];

      MoodEntry.find = () => ({
        select: () => ({
          sort: () => Promise.resolve(gapEntries)
        })
      });

      const res = await request(app)
        .get('/api/analytics/streak')
        .set('Authorization', `Bearer ${authToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.currentStreak, 1);
      assert.strictEqual(res.body.data.longestStreak, 5);
      assert.strictEqual(res.body.data.totalCheckInDays, 6);
    });
  });

  describe('Pure Mathematical & Statistical Validation Functions', () => {
    it('calculates Pearson correlation coefficient accurately', () => {
      // Perfect positive correlation: x and y move in lockstep
      const xPos = [1, 2, 3, 4, 5];
      const yPos = [2, 4, 6, 8, 10];
      const rPos = calculatePearsonCorrelation(xPos, yPos);
      assert.strictEqual(rPos, 1);

      // Strong negative correlation
      const xNeg = [1, 2, 3, 4, 5];
      const yNeg = [10, 8, 6, 4, 2];
      const rNeg = calculatePearsonCorrelation(xNeg, yNeg);
      assert.strictEqual(rNeg, -1);

      // Insufficient sample points (< 5) returns null
      assert.strictEqual(calculatePearsonCorrelation([1, 2], [3, 4]), null);
    });

    it('calculates sample standard deviation accurately', () => {
      // Zero variance
      assert.strictEqual(calculateStandardDeviation([8, 8, 8, 8]), 0);

      // Sample variance
      const sd = calculateStandardDeviation([5, 7, 9]);
      assert.strictEqual(sd, 2.0);
    });

    it('categorizes temperature bands and conditions properly in weather analysis', () => {
      const entries = [
        { temperature: 10, mood: 2, weatherCondition: 'Rainy', precipitation: 5 },
        { temperature: 20, mood: 4, weatherCondition: 'Cloudy', precipitation: 0 },
        { temperature: 28, mood: 5, weatherCondition: 'Sunny', precipitation: 0 }
      ];

      const tempAnalysis = analyzeMoodVsTemperature(entries);
      assert.strictEqual(tempAnalysis.temperatureBands.length, 3);
      assert.strictEqual(tempAnalysis.temperatureBands[0].label, 'Cool (< 15°C)');
      assert.strictEqual(tempAnalysis.temperatureBands[0].avgMood, 2);
      assert.strictEqual(tempAnalysis.temperatureBands[1].avgMood, 4);
      assert.strictEqual(tempAnalysis.temperatureBands[2].avgMood, 5);

      const condAnalysis = analyzeMoodVsCondition(entries);
      assert.strictEqual(condAnalysis.conditionBreakdown.length, 3);
      assert.strictEqual(condAnalysis.conditionBreakdown[0].condition, 'Sunny'); // Ranked top (mood 5)

      const precipAnalysis = analyzeMoodVsPrecipitation(entries);
      assert.strictEqual(precipAnalysis.dryDays.count, 2);
      assert.strictEqual(precipAnalysis.precipitationDays.count, 1);
    });
  });
});
