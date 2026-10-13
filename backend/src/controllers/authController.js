const authService = require('../services/authService');

/**
 * Handle user registration
 * @route POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const result = await authService.registerUser({ name, email, password });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle user login
 * @route POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch authenticated user profile
 * @route GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    // req.user is set by authenticate middleware
    res.status(200).json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update authenticated user profile (name, avatar, email)
 * @route PUT /api/auth/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, email, avatar } = req.body;
    const result = await authService.updateUserProfile(req.userId, { name, email, avatar });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change authenticated user password
 * @route PUT /api/auth/password
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changeUserPassword(req.userId, { currentPassword, newPassword });

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete authenticated user account and all associated personal data
 * @route DELETE /api/auth/me
 */
const deleteAccount = async (req, res, next) => {
  try {
    const result = await authService.deleteUserAccount(req.userId);

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  deleteAccount
};
