const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Generate a signed JWT token
 * @param {object} payload - Data to embed in the token (e.g., { userId, email })
 * @returns {string} Signed JWT token
 */
const generateToken = (payload) => {
  const tokenPayload = typeof payload === 'string' ? { userId: payload } : payload;
  return jwt.sign(tokenPayload, config.jwt.secret, {
    algorithm: 'HS256',
    expiresIn: config.jwt.expiresIn
  });
};

/**
 * Verify and decode a JWT token
 * Enforces algorithm allowlist to prevent algorithm-confusion attacks
 * @param {string} token - The Bearer token
 * @returns {object} Decoded payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, config.jwt.secret, {
    algorithms: ['HS256']
  });
};

module.exports = {
  generateToken,
  verifyToken
};
