const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const { User, MoodEntry } = require('../src/models');
const { generateToken } = require('../src/utils/jwtHelper');

describe('Backend: Data Export Suite', () => {
  const testUserId = '65432165432165432165432e';
  const testUser = {
    _id: testUserId,
    id: testUserId,
    name: 'Export Tester',
    email: 'export@example.com'
  };

  const authToken = generateToken({ userId: testUser.id, email: testUser.email });

  const sampleEntries = [
    {
      entryDate: new Date('2026-03-01T00:00:00Z'),
      mood: 4,
      sleepHours: 7.5,
      feelings: ['calm', 'grateful'],
      reflection: 'A great day, relaxed with coffee.',
      temperature: 21.5,
      weatherCondition: 'Sunny',
      precipitation: 0.0
    },
    {
      entryDate: new Date('2026-03-02T00:00:00Z'),
      mood: 2,
      sleepHours: 5.0,
      feelings: ['tired', 'stressed'],
      reflection: 'Complex problem at work,\nrequired "overtime".',
      temperature: 15.0,
      weatherCondition: 'Rainy',
      precipitation: 12.4
    }
  ];

  beforeEach(() => {
    User.findById = (id) => ({
      select: () => Promise.resolve(testUser),
      then: (resolve) => resolve(testUser)
    });

    MoodEntry.find = (filter) => {
      let filtered = [];
      if (filter.userId === testUser.id) {
        filtered = sampleEntries;
      }
      return {
        sort: () => ({
          select: () => Promise.resolve(filtered)
        })
      };
    };
  });

  describe('GET /api/export/json', () => {
    it('exports user mood history in JSON format with proper attachment headers', async () => {
      const res = await request(app)
        .get('/api/export/json')
        .set('Authorization', `Bearer ${authToken}`);

      assert.strictEqual(res.status, 200);
      assert.match(res.headers['content-type'], /application\/json/i);
      assert.match(res.headers['content-disposition'], /attachment; filename="moodtrack-export.*\.json"/i);

      assert.ok(Array.isArray(res.body));
      assert.strictEqual(res.body.length, 2);
      assert.strictEqual(res.body[0].date, '2026-03-01');
      assert.strictEqual(res.body[0].mood, 4);
      assert.strictEqual(res.body[0].sleepHours, 7.5);
      assert.deepStrictEqual(res.body[0].feelings, ['calm', 'grateful']);
      assert.strictEqual(res.body[0].reflection, 'A great day, relaxed with coffee.');
      assert.strictEqual(res.body[0].temperature, 21.5);
      assert.strictEqual(res.body[0].weatherCondition, 'Sunny');
      assert.strictEqual(res.body[0].precipitation, 0.0);
    });

    it('ensures no sensitive fields (passwordHash, JWT, internal keys) are in JSON export', async () => {
      const res = await request(app)
        .get('/api/export/json')
        .set('Authorization', `Bearer ${authToken}`);

      assert.strictEqual(res.status, 200);
      res.body.forEach((entry) => {
        assert.strictEqual(entry.passwordHash, undefined);
        assert.strictEqual(entry.token, undefined);
        assert.strictEqual(entry._id, undefined);
        assert.strictEqual(entry.__v, undefined);
      });
    });

    it('rejects unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/export/json');
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });
  });

  describe('GET /api/export/csv', () => {
    it('exports user mood history in clean RFC 4180 CSV format', async () => {
      const res = await request(app)
        .get('/api/export/csv')
        .set('Authorization', `Bearer ${authToken}`);

      assert.strictEqual(res.status, 200);
      assert.match(res.headers['content-type'], /text\/csv/i);
      assert.match(res.headers['content-disposition'], /attachment; filename="moodtrack-export.*\.csv"/i);

      const csvText = res.text;
      assert.ok(csvText.startsWith('\uFEFF'), 'CSV should begin with UTF-8 BOM');

      const lines = csvText.replace('\uFEFF', '').trim().split('\r\n');
      assert.strictEqual(
        lines[0],
        'date,mood,sleepHours,feelings,reflection,temperature,weatherCondition,precipitation'
      );
      assert.match(lines[1], /^2026-03-01,4,7.5,"calm, grateful","A great day, relaxed with coffee\.",21.5,Sunny,0/);
      assert.match(lines[2], /"Complex problem at work,\r?\nrequired ""overtime""\."/);
    });

    it('ensures no sensitive credentials or internal fields exist in CSV export', async () => {
      const res = await request(app)
        .get('/api/export/csv')
        .set('Authorization', `Bearer ${authToken}`);

      assert.strictEqual(res.status, 200);
      const csvText = res.text;
      assert.strictEqual(csvText.includes('passwordHash'), false);
      assert.strictEqual(csvText.includes('token'), false);
      assert.strictEqual(csvText.includes('_id'), false);
    });

    it('rejects unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/export/csv');
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });
  });
});
