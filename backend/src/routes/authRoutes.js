const express = require('express');
const authController = require('../controllers/authController');
const {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword
} = require('../validators/authValidator');
const authenticate = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Public routes with brute-force rate limiting protection
router.post('/register', authLimiter, validateRegister, authController.register);
router.post('/login', authLimiter, validateLogin, authController.login);

// Protected routes (User can only read and modify their own account)
router.get('/me', authenticate, authController.getMe);
router.put('/profile', authenticate, validateUpdateProfile, authController.updateProfile);
router.put('/me', authenticate, validateUpdateProfile, authController.updateProfile);
router.put('/password', authenticate, validateChangePassword, authController.changePassword);
router.delete('/me', authenticate, authController.deleteAccount);

module.exports = router;
