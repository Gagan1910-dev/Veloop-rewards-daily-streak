import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'veloop_jwt_dev_secret_key_change_in_prod';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate a signed JWT for a user
 * @param {Object} payload
 * @param {string} payload.userId
 * @param {string} payload.email
 * @param {string} payload.role
 * @returns {string} Signed JWT
 */
export const generateToken = (payload) => {
  return jwt.sign(
    {
      id: payload.userId,
      email: payload.email,
      role: payload.role || 'user'
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Verify and decode a JWT token
 * @param {string} token
 * @returns {Object} Decoded payload
 */
export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};
