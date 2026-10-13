const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { User, MoodEntry, Reminder } = require('../models');
const config = require('../config');
const { generateToken } = require('../utils/jwtHelper');

// Precomputed 12-round bcrypt dummy hash used for constant-time comparisons against non-existent users
const DUMMY_BCRYPT_HASH = '$2a$12$e8YQ5c1GkYfH8E4n7w2.x.WlC9yFh.uI7i6x4y4M3k5u1e8w1o4mS';

/**
 * Register a new user
 * @param {object} userData - { name, email, password }
 * @returns {Promise<{user: object, token: string}>}
 */
const registerUser = async ({ name, email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  // Check for existing user with identical email
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    const error = new Error('An account with this email address already exists.');
    error.statusCode = 409;
    throw error;
  }

  // Hash password securely with bcrypt using configured salt rounds (default 12)
  const saltRounds = config.security?.saltRounds || 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Generate a friendly default avatar based on user initials
  const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}`;

  // Create new user in database
  const userDoc = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    avatar
  });

  const user = {
    id: userDoc._id ? userDoc._id.toString() : userDoc.id,
    name: userDoc.name,
    email: userDoc.email,
    avatar: userDoc.avatar,
    createdAt: userDoc.createdAt,
    updatedAt: userDoc.updatedAt
  };

  // Generate JWT token
  const token = generateToken({ userId: user.id, email: user.email });

  return { user, token };
};

/**
 * Authenticate and log in an existing user
 * Employs constant-time password comparison to prevent timing-based user enumeration attacks
 * @param {object} credentials - { email, password }
 * @returns {Promise<{user: object, token: string}>}
 */
const loginUser = async ({ email, password }) => {
  const normalizedEmail = email ? email.trim().toLowerCase() : '';

  // Find user by normalized email
  const userDoc = await User.findOne({ email: normalizedEmail });

  // Mitigate user enumeration timing attacks:
  // If user does not exist, run comparison against dummy hash so execution time remains indistinguishable
  const hashToCompare = userDoc ? userDoc.passwordHash : DUMMY_BCRYPT_HASH;
  const isMatch = await bcrypt.compare(password, hashToCompare);

  if (!userDoc || !isMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const userId = userDoc._id ? userDoc._id.toString() : userDoc.id;

  // Generate JWT token
  const token = generateToken({ userId, email: userDoc.email });

  // Sanitize user object (never return passwordHash)
  const sanitizedUser = {
    id: userId,
    name: userDoc.name,
    email: userDoc.email,
    avatar: userDoc.avatar,
    createdAt: userDoc.createdAt,
    updatedAt: userDoc.updatedAt
  };

  return { user: sanitizedUser, token };
};

/**
 * Fetch current user by ID
 * @param {string} userId
 * @returns {Promise<object>}
 */
const getUserById = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId) && typeof userId !== 'string') {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  const userDoc = await User.findById(userId).select('-passwordHash');

  if (!userDoc) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  return {
    id: userDoc._id ? userDoc._id.toString() : userDoc.id,
    name: userDoc.name,
    email: userDoc.email,
    avatar: userDoc.avatar,
    createdAt: userDoc.createdAt,
    updatedAt: userDoc.updatedAt
  };
};

/**
 * Update authenticated user's profile information (name, email, avatar URL)
 * @param {string} userId
 * @param {object} profileData - { name, email, avatar }
 * @returns {Promise<{user: object, token?: string}>}
 */
const updateUserProfile = async (userId, { name, email, avatar }) => {
  const existingUser = await User.findById(userId);

  if (!existingUser) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  // If email is changing, verify uniqueness
  const normalizedEmail = email !== undefined ? email.trim().toLowerCase() : undefined;
  if (normalizedEmail && normalizedEmail !== existingUser.email) {
    const emailTaken = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: existingUser._id }
    });

    if (emailTaken) {
      const error = new Error('This email address is already in use by another account.');
      error.statusCode = 409;
      throw error;
    }
  }

  if (name !== undefined) existingUser.name = name.trim();
  if (normalizedEmail !== undefined) existingUser.email = normalizedEmail;
  if (avatar !== undefined) existingUser.avatar = avatar;

  await existingUser.save();

  const updatedId = existingUser._id ? existingUser._id.toString() : existingUser.id;
  const updatedUser = {
    id: updatedId,
    name: existingUser.name,
    email: existingUser.email,
    avatar: existingUser.avatar,
    createdAt: existingUser.createdAt,
    updatedAt: existingUser.updatedAt
  };

  // If email was changed, issue a refreshed token with updated email payload
  let token = null;
  if (normalizedEmail && normalizedEmail !== existingUser.email) {
    token = generateToken({ userId: updatedId, email: updatedUser.email });
  }

  return {
    user: updatedUser,
    ...(token && { token })
  };
};

/**
 * Change authenticated user's password securely
 * @param {string} userId
 * @param {object} passwordData - { currentPassword, newPassword }
 */
const changeUserPassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId);

  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  // Verify current password
  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    const error = new Error('Current password is incorrect.');
    error.statusCode = 400;
    throw error;
  }

  // Hash new password securely with bcrypt using configured salt rounds
  const saltRounds = config.security?.saltRounds || 12;
  const passwordHash = await bcrypt.hash(newPassword, saltRounds);

  user.passwordHash = passwordHash;
  await user.save();

  return {
    success: true,
    message: 'Password changed successfully.'
  };
};

/**
 * Irreversibly delete authenticated user account and all personal data records
 * (Mood entries, reminder configurations, user credentials)
 * Enforces strict user-level isolation and right-to-be-forgotten privacy compliance.
 * @param {string} userId
 */
const deleteUserAccount = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  // Delete all associated user records across collections
  await Promise.all([
    MoodEntry.deleteMany({ userId }),
    Reminder.deleteMany({ userId }),
    User.deleteOne({ _id: userId })
  ]);

  return {
    success: true,
    message: 'Your account and all associated mood and reminder data have been permanently deleted.'
  };
};

module.exports = {
  registerUser,
  loginUser,
  getUserById,
  updateUserProfile,
  changeUserPassword,
  deleteUserAccount
};
