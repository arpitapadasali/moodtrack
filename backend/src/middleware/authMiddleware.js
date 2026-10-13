const { verifyToken } = require('../utils/jwtHelper');
const { User } = require('../models');

/**
 * Authentication middleware to verify JWT and attach authenticated user to request
 */
const authenticate = async (req, res, next) => {
  // Prevent caching of protected personal user data in proxies or browsers
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || (!authHeader.startsWith('Bearer ') && authHeader !== 'Bearer')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.'
      });
    }

    const token = authHeader.replace(/^Bearer\s*/, '').trim();
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Bearer token is empty.'
      });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Authentication token has expired. Please log in again.'
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.'
      });
    }

    // Validate token payload integrity
    if (!decoded || typeof decoded !== 'object' || !decoded.userId || typeof decoded.userId !== 'string') {
      return res.status(401).json({
        success: false,
        message: 'Malformed authentication token payload.'
      });
    }

    // Identify user in database
    const userDoc = await User.findById(decoded.userId).select('-passwordHash');

    if (!userDoc) {
      return res.status(401).json({
        success: false,
        message: 'The user account associated with this token no longer exists.'
      });
    }

    const user = {
      id: userDoc._id ? userDoc._id.toString() : userDoc.id,
      name: userDoc.name,
      email: userDoc.email,
      avatar: userDoc.avatar,
      createdAt: userDoc.createdAt,
      updatedAt: userDoc.updatedAt
    };

    // Attach user ID and sanitized user object to request
    req.userId = user.id;
    req.user = user;

    // Prevent caching of protected personal user data in proxies or browsers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authenticate;
