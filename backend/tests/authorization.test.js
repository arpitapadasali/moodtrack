const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { User, MoodEntry } = require('../src/models');
const config = require('../src/config');
const { generateToken } = require('../src/utils/jwtHelper');

describe('Backend: Authorization & Security Suite', () => {
  const userA = {
    _id: '65432165432165432165432a',
    id: '65432165432165432165432a',
    name: 'User A',
    email: 'user.a@example.com',
    avatar: 'https://example.com/a.jpg',
    save: async function () {
      return this;
    }
  };

  const userB = {
    _id: '65432165432165432165432b',
    id: '65432165432165432165432b',
    name: 'User B',
    email: 'user.b@example.com',
    avatar: 'https://example.com/b.jpg',
    save: async function () {
      return this;
    }
  };

  beforeEach(() => {
    User.findById = (id) => {
      const idStr = id ? id.toString() : '';
      let found = null;
      if (idStr === userA.id) found = userA;
      if (idStr === userB.id) found = userB;

      return {
        select: (fields) => {
          if (!found) return Promise.resolve(null);
          const copy = { ...found };
          if (fields && fields.includes('-passwordHash')) delete copy.passwordHash;
          return Promise.resolve(copy);
        },
        then: (resolve) => resolve(found ? { ...found } : null)
      };
    };

    User.findOne = async (filter) => {
      if (filter.email === userA.email) return { ...userA };
      if (filter.email === userB.email) return { ...userB };
      return null;
    };
  });

  describe('JWT Authentication Gatekeeping', () => {
    it('rejects requests with missing Authorization header (401)', async () => {
      const res = await request(app).get('/api/moods/today');

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /no authentication token provided/i);
    });

    it('rejects requests without "Bearer " prefix (401)', async () => {
      const res = await request(app)
        .get('/api/moods/today')
        .set('Authorization', 'Basic 123456');

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /no authentication token provided/i);
    });

    it('rejects requests with empty Bearer token string (401)', async () => {
      const res = await request(app)
        .get('/api/moods/today')
        .set('Authorization', 'Bearer ');

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /bearer token is empty/i);
    });

    it('rejects requests with corrupted/invalid JWT token (401)', async () => {
      const res = await request(app)
        .get('/api/moods/today')
        .set('Authorization', 'Bearer invalid.corrupted.jwt.token');

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /invalid authentication token/i);
    });

    it('rejects requests with token signed with foreign secret key (401)', async () => {
      const foreignToken = jwt.sign(
        { userId: userA.id, email: userA.email },
        'unauthorized_foreign_secret_key_99999999',
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/api/moods/today')
        .set('Authorization', `Bearer ${foreignToken}`);

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /invalid authentication token/i);
    });

    it('rejects requests with expired JWT token with explicit expiration notification (401)', async () => {
      const expiredToken = jwt.sign(
        { userId: userA.id, email: userA.email },
        config.jwt.secret,
        { expiresIn: '-1s' }
      );

      const res = await request(app)
        .get('/api/moods/today')
        .set('Authorization', `Bearer ${expiredToken}`);

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /has expired/i);
    });

    it('rejects requests if authenticated user was deleted from the database (401)', async () => {
      User.findById = () => ({
        select: () => Promise.resolve(null),
        then: (resolve) => resolve(null)
      });
      const token = generateToken({ userId: '65432165432165432165432f', email: 'deleted@example.com' });

      const res = await request(app)
        .get('/api/moods/today')
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /no longer exists/i);
    });
  });

  describe('Cross-User Data Isolation', () => {
    it('strictly isolates mood entry queries by userId (User A cannot access User B entry)', async () => {
      const tokenA = generateToken({ userId: userA.id, email: userA.email });

      let queriedUserId = null;
      MoodEntry.findOne = async (filter) => {
        queriedUserId = filter.userId;
        if (queriedUserId === userB.id) {
          return { id: 'entry-b', userId: userB.id, mood: 5, sleepHours: 8 };
        }
        return null;
      };

      const res = await request(app)
        .get('/api/moods/2026-03-01')
        .set('Authorization', `Bearer ${tokenA}`);

      assert.strictEqual(res.status, 404);
      assert.strictEqual(queriedUserId, userA.id, 'Query must be constrained to the requesting user ID');
    });

    it('strictly isolates export endpoints by userId', async () => {
      const tokenA = generateToken({ userId: userA.id, email: userA.email });

      let queriedUserId = null;
      MoodEntry.find = (filter) => {
        queriedUserId = filter.userId;
        const entries = [
          {
            entryDate: new Date('2026-03-01T00:00:00Z'),
            mood: 4,
            sleepHours: 7.5,
            feelings: ['calm'],
            reflection: 'User A private journal'
          }
        ];
        return {
          sort: () => ({
            select: () => Promise.resolve(entries)
          })
        };
      };

      const res = await request(app)
        .get('/api/export/json')
        .set('Authorization', `Bearer ${tokenA}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(queriedUserId, userA.id, 'Export must query only User A entries');
      assert.strictEqual(res.body[0].reflection, 'User A private journal');
    });

    it('strictly isolates profile mutation to authenticated user only', async () => {
      const tokenA = generateToken({ userId: userA.id, email: userA.email });

      let updatedTargetId = null;
      const targetUser = {
        _id: userA.id,
        id: userA.id,
        name: userA.name,
        email: userA.email,
        avatar: userA.avatar,
        save: async function () {
          updatedTargetId = this.id;
          return this;
        }
      };

      User.findById = (id) => ({
        select: () => Promise.resolve(targetUser),
        then: (resolve) => resolve(targetUser)
      });

      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'User A Modified' });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(updatedTargetId, userA.id, 'Profile update must only affect authenticated user');
    });
  });
});
