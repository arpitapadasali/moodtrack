const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const { User, MoodEntry, Reminder } = require('../src/models');
const { generateToken } = require('../src/utils/jwtHelper');

const bcrypt = require('bcryptjs');
const testPasswordHash = bcrypt.hashSync('Password123!', 8);

describe('Backend: Authentication & User Management Suite', () => {
  const testUserId = '654321654321654321654321';
  let testUser;

  beforeEach(() => {
    testUser = {
      _id: testUserId,
      id: testUserId,
      name: 'Alex Tester',
      email: 'alex.tester@example.com',
      passwordHash: testPasswordHash,
      avatar: 'https://example.com/avatar.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
      save: async function () {
        return this;
      }
    };

    // Mock User model methods
    User.findOne = async (filter) => {
      if (filter.email && filter.email.toLowerCase() === testUser.email.toLowerCase()) {
        if (filter._id && filter._id.$ne && filter._id.$ne.toString() === testUser._id.toString()) {
          return null;
        }
        return { ...testUser };
      }
      if (filter.email === 'taken@example.com') {
        return {
          _id: '999999999999999999999999',
          id: '999999999999999999999999',
          email: 'taken@example.com'
        };
      }
      return null;
    };

    User.findById = (id) => {
      const idStr = id ? id.toString() : '';
      const queryObj = {
        select: (fields) => {
          if (idStr === testUserId) {
            const copy = { ...testUser };
            if (fields && fields.includes('-passwordHash')) {
              delete copy.passwordHash;
            }
            return Promise.resolve(copy);
          }
          return Promise.resolve(null);
        },
        then: (resolve, reject) => {
          if (idStr === testUserId) {
            resolve({ ...testUser });
          } else {
            resolve(null);
          }
        }
      };
      return queryObj;
    };

    User.create = async (data) => {
      const created = {
        _id: '888888888888888888888888',
        id: '888888888888888888888888',
        name: data.name,
        email: data.email,
        avatar: data.avatar,
        passwordHash: data.passwordHash,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      return created;
    };
  });

  describe('POST /api/auth/register', () => {
    it('successfully registers a user with valid credentials', async () => {
      const origFindOne = User.findOne;
      User.findOne = async () => null; // Email not taken

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New User',
          email: 'newuser@example.com',
          password: 'Password123!'
        });

      User.findOne = origFindOne;

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.token, 'Token should be returned');
      assert.strictEqual(res.body.data.user.email, 'newuser@example.com');
      assert.strictEqual(res.body.data.user.passwordHash, undefined, 'passwordHash must never be returned');
    });

    it('rejects registration if email already exists with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Alex Duplicate',
          email: 'alex.tester@example.com',
          password: 'Password123!'
        });

      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /already exists/i);
    });

    it('validates missing required registration fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({});

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(Array.isArray(res.body.errors));
    });

    it('validates short password (< 6 characters)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Short Pass',
          email: 'shortpass@example.com',
          password: '123'
        });

      assert.strictEqual(res.status, 400);
      assert.ok(res.body.errors.some((err) => err.includes('at least 6 characters')));
    });

    it('validates invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Bad Email',
          email: 'invalid-email-address',
          password: 'Password123!'
        });

      assert.strictEqual(res.status, 400);
      assert.ok(res.body.errors.some((err) => err.includes('valid email')));
    });
  });

  describe('POST /api/auth/login', () => {
    it('successfully logs in with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alex.tester@example.com',
          password: 'Password123!'
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.token);
      assert.strictEqual(res.body.data.user.email, 'alex.tester@example.com');
      assert.strictEqual(res.body.data.user.passwordHash, undefined);
    });

    it('handles email casing in a case-insensitive manner', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'ALEX.TESTER@EXAMPLE.COM',
          password: 'Password123!'
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
    });

    it('rejects login with incorrect password with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alex.tester@example.com',
          password: 'WrongPassword999!'
        });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.message, 'Invalid email or password.');
    });

    it('rejects non-existent user with identical 401 message (timing attack prevention)', async () => {
      const origFindOne = User.findOne;
      User.findOne = async () => null;

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'doesnotexist@example.com',
          password: 'Password123!'
        });

      User.findOne = origFindOne;

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.message, 'Invalid email or password.');
    });
  });

  describe('GET /api/auth/me (Protected)', () => {
    it('returns current authenticated user profile without sensitive fields', async () => {
      const token = generateToken({ userId: testUser.id, email: testUser.email });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.user.id, testUser.id);
      assert.strictEqual(res.body.data.user.passwordHash, undefined);
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('updates name and avatar', async () => {
      const token = generateToken({ userId: testUser.id, email: testUser.email });

      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Alex Morgan Updated',
          avatar: 'https://example.com/new-avatar.png'
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.user.name, 'Alex Morgan Updated');
    });

    it('rejects changing to an email that is already taken by another user', async () => {
      const token = generateToken({ userId: testUser.id, email: testUser.email });

      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: 'taken@example.com'
        });

      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /already in use/i);
    });
  });

  describe('PUT /api/auth/password', () => {
    it('successfully changes password when current password is valid', async () => {
      const token = generateToken({ userId: testUser.id, email: testUser.email });

      const res = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'Password123!',
          newPassword: 'BrandNewPassword456!',
          confirmPassword: 'BrandNewPassword456!'
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.match(res.body.message, /password changed successfully/i);
    });

    it('rejects password change if new password and confirmation mismatch', async () => {
      const token = generateToken({ userId: testUser.id, email: testUser.email });

      const res = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'Password123!',
          newPassword: 'BrandNewPassword456!',
          confirmPassword: 'MismatchPassword!'
        });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.errors[0], /match/i);
    });

    it('rejects password change if current password is incorrect', async () => {
      const token = generateToken({ userId: testUser.id, email: testUser.email });

      const res = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'WrongCurrentPassword!',
          newPassword: 'BrandNewPassword456!',
          confirmPassword: 'BrandNewPassword456!'
        });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /current password is incorrect/i);
    });
  });

  describe('DELETE /api/auth/me (Account & Data Deletion)', () => {
    it('successfully deletes user account and cascading data', async () => {
      let userDeleted = false;
      let moodEntriesDeleted = false;
      let remindersDeleted = false;

      User.deleteOne = async (filter) => {
        if (filter._id === testUser.id) userDeleted = true;
        return { deletedCount: 1 };
      };
      MoodEntry.deleteMany = async (filter) => {
        if (filter.userId === testUser.id) moodEntriesDeleted = true;
        return { deletedCount: 5 };
      };
      Reminder.deleteMany = async (filter) => {
        if (filter.userId === testUser.id) remindersDeleted = true;
        return { deletedCount: 1 };
      };

      const token = generateToken({ userId: testUser.id, email: testUser.email });

      const res = await request(app)
        .delete('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.match(res.body.message, /permanently deleted/i);
      assert.strictEqual(userDeleted, true);
      assert.strictEqual(moodEntriesDeleted, true);
      assert.strictEqual(remindersDeleted, true);
    });

    it('rejects unauthenticated request with 401', async () => {
      const res = await request(app).delete('/api/auth/me');
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });
  });
});
