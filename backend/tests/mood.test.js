const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const { User, MoodEntry } = require('../src/models');
const { generateToken } = require('../src/utils/jwtHelper');

describe('Backend: Mood Entry Lifecycle & Validation Suite', () => {
  const testUserId = '654321654321654321654320';
  const testUser = {
    _id: testUserId,
    id: testUserId,
    name: 'Jordan Tracker',
    email: 'jordan@example.com'
  };

  const authToken = generateToken({ userId: testUser.id, email: testUser.email });

  let mockEntries = [];

  beforeEach(() => {
    mockEntries = [
      {
        _id: '6543216543216543216543e1',
        id: '6543216543216543216543e1',
        userId: testUser.id,
        entryDate: new Date('2026-03-10T00:00:00Z'),
        mood: 4,
        sleepHours: 7.5,
        feelings: ['calm', 'focused'],
        reflection: 'Productive day at work.',
        temperature: 22.0,
        weatherCondition: 'Sunny',
        precipitation: 0.0,
        createdAt: new Date(),
        updatedAt: new Date(),
        save: async function () {
          return this;
        }
      }
    ];

    User.findById = (id) => ({
      select: () => Promise.resolve(testUser),
      then: (resolve) => resolve(testUser)
    });

    MoodEntry.findOne = async (filter) => {
      const { userId, entryDate } = filter;
      const targetTime = new Date(entryDate).getTime();
      return (
        mockEntries.find(
          (e) => (e.userId.toString() === userId.toString()) && new Date(e.entryDate).getTime() === targetTime
        ) || null
      );
    };

    MoodEntry.find = (filter) => {
      let filtered = mockEntries.filter((e) => e.userId.toString() === filter.userId.toString());
      return {
        sort: (sortObj) => ({
          limit: (limitCount) => {
            if (sortObj?.entryDate === -1) {
              filtered.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
            }
            return Promise.resolve(filtered.slice(0, limitCount));
          }
        })
      };
    };

    MoodEntry.create = async (data) => {
      const created = {
        _id: `6543216543216543216543e${Date.now() % 100}`,
        id: `mock-created-${Date.now()}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
        save: async function () {
          return this;
        }
      };
      mockEntries.push(created);
      return created;
    };

    MoodEntry.deleteOne = async (filter) => {
      const { userId, entryDate } = filter;
      const targetTime = new Date(entryDate).getTime();
      const idx = mockEntries.findIndex(
        (e) => (e.userId.toString() === userId.toString()) && new Date(e.entryDate).getTime() === targetTime
      );
      if (idx !== -1) {
        mockEntries.splice(idx, 1);
      }
      return { deletedCount: idx !== -1 ? 1 : 0 };
    };
  });

  describe('CRUD Operations', () => {
    it('creates a new mood entry with valid inputs (POST /api/moods)', async () => {
      const res = await request(app)
        .post('/api/moods')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          entryDate: '2026-03-11',
          mood: 5,
          sleepHours: 8.0,
          feelings: ['energetic', 'happy'],
          reflection: 'Completed all core features ahead of time.',
          temperature: 24.5,
          weatherCondition: 'Clear',
          precipitation: 0.0
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.mood, 5);
      assert.strictEqual(res.body.data.sleepHours, 8.0);
      assert.deepStrictEqual(res.body.data.feelings, ['energetic', 'happy']);
      assert.strictEqual(res.body.data.reflection, 'Completed all core features ahead of time.');
    });

    it('rejects duplicate entry for same date with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/moods')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          entryDate: '2026-03-10', // already in mockEntries
          mood: 3,
          sleepHours: 6.0
        });

      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /already exists/i);
    });

    it('fetches existing entry by date (GET /api/moods/:date)', async () => {
      const res = await request(app)
        .get('/api/moods/2026-03-10')
        .set('Authorization', `Bearer ${authToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.mood, 4);
      assert.strictEqual(res.body.data.sleepHours, 7.5);
    });

    it('returns 404 when querying an entry for an unrecorded date', async () => {
      const res = await request(app)
        .get('/api/moods/2026-01-01')
        .set('Authorization', `Bearer ${authToken}`);

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /no mood entry found/i);
    });

    it('updates an existing mood entry (PUT /api/moods/:date)', async () => {
      const res = await request(app)
        .put('/api/moods/2026-03-10')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          mood: 5,
          sleepHours: 8.5,
          feelings: ['accomplished'],
          reflection: 'Evening reflection added.'
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.mood, 5);
      assert.strictEqual(res.body.data.sleepHours, 8.5);
    });

    it('returns 404 when updating non-existent date', async () => {
      const res = await request(app)
        .put('/api/moods/2026-01-01')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ mood: 3, sleepHours: 7 });

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.success, false);
    });

    it('deletes an existing mood entry (DELETE /api/moods/:date)', async () => {
      const res = await request(app)
        .delete('/api/moods/2026-03-10')
        .set('Authorization', `Bearer ${authToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.deleted, true);
      assert.strictEqual(res.body.data.entryDate, '2026-03-10');
      assert.strictEqual(mockEntries.length, 0);
    });

    it('returns 404 when deleting a non-existent entry', async () => {
      const res = await request(app)
        .delete('/api/moods/2026-01-01')
        .set('Authorization', `Bearer ${authToken}`);

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.success, false);
    });

    it('fetches recent entries (GET /api/moods/recent)', async () => {
      const res = await request(app)
        .get('/api/moods/recent?limit=5')
        .set('Authorization', `Bearer ${authToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
      assert.strictEqual(res.body.data.length, 1);
    });
  });

  describe('Input Validation Edge Cases', () => {
    it('rejects mood score < 1 (e.g. 0)', async () => {
      const res = await request(app)
        .post('/api/moods')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ entryDate: '2026-03-12', mood: 0, sleepHours: 7 });

      assert.strictEqual(res.status, 400);
      assert.ok(res.body.errors.some((e) => e.includes('between 1 and 5')));
    });

    it('rejects mood score > 5 (e.g. 6)', async () => {
      const res = await request(app)
        .post('/api/moods')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ entryDate: '2026-03-12', mood: 6, sleepHours: 7 });

      assert.strictEqual(res.status, 400);
      assert.ok(res.body.errors.some((e) => e.includes('between 1 and 5')));
    });

    it('rejects non-integer mood score (e.g. 3.5)', async () => {
      const res = await request(app)
        .post('/api/moods')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ entryDate: '2026-03-12', mood: 3.5, sleepHours: 7 });

      assert.strictEqual(res.status, 400);
      assert.ok(res.body.errors.some((e) => e.includes('integer')));
    });

    it('rejects negative sleep hours (e.g. -1)', async () => {
      const res = await request(app)
        .post('/api/moods')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ entryDate: '2026-03-12', mood: 4, sleepHours: -1 });

      assert.strictEqual(res.status, 400);
      assert.ok(res.body.errors.some((e) => e.includes('between 0 and 24')));
    });

    it('rejects excessive sleep hours > 24 (e.g. 25)', async () => {
      const res = await request(app)
        .post('/api/moods')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ entryDate: '2026-03-12', mood: 4, sleepHours: 25 });

      assert.strictEqual(res.status, 400);
      assert.ok(res.body.errors.some((e) => e.includes('between 0 and 24')));
    });

    it('rejects non-numeric sleep hours', async () => {
      const res = await request(app)
        .post('/api/moods')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ entryDate: '2026-03-12', mood: 4, sleepHours: 'seven' });

      assert.strictEqual(res.status, 400);
      assert.ok(res.body.errors.some((e) => e.includes('number')));
    });

    it('rejects invalid date parameter format in URL (e.g. 2026-99-99)', async () => {
      const res = await request(app)
        .get('/api/moods/2026-99-99')
        .set('Authorization', `Bearer ${authToken}`);

      assert.strictEqual(res.status, 400);
      assert.match(res.body.message, /YYYY-MM-DD/);
    });

    it('rejects reflection exceeding 2000 characters', async () => {
      const longText = 'a'.repeat(2001);
      const res = await request(app)
        .post('/api/moods')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ entryDate: '2026-03-12', mood: 4, sleepHours: 7, reflection: longText });

      assert.strictEqual(res.status, 400);
      assert.ok(res.body.errors.some((e) => e.includes('exceed 2000')));
    });

    it('rejects feeling tag exceeding 30 characters', async () => {
      const res = await request(app)
        .post('/api/moods')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          entryDate: '2026-03-12',
          mood: 4,
          sleepHours: 7,
          feelings: ['this_is_an_extremely_excessively_long_emotion_tag']
        });

      assert.strictEqual(res.status, 400);
      assert.ok(res.body.errors.some((e) => e.includes('exceed 30')));
    });

    it('rejects more than 20 feelings in one entry', async () => {
      const tooManyFeelings = Array(21).fill('happy');
      const res = await request(app)
        .post('/api/moods')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ entryDate: '2026-03-12', mood: 4, sleepHours: 7, feelings: tooManyFeelings });

      assert.strictEqual(res.status, 400);
      assert.ok(res.body.errors.some((e) => e.includes('cannot exceed 20')));
    });
  });
});
