import apiClient from './apiClient.js';

/**
 * Register a new user account
 * @param {Object} userData - { name, email, password }
 * @returns {Promise<Object>} { user, wallet, token }
 */
export const register = async ({ name, email, password }) => {
  const res = await apiClient.post('/auth/register', { name, email, password });
  return res.data;
};

/**
 * Authenticate existing user
 * @param {Object} credentials - { email, password }
 * @returns {Promise<Object>} { user, wallet, token }
 */
export const login = async ({ email, password }) => {
  const res = await apiClient.post('/auth/login', { email, password });
  return res.data;
};

/**
 * Fetch authenticated user identity and live wallet balance
 * @returns {Promise<Object>} { user, wallet }
 */
export const getMe = async () => {
  const res = await apiClient.get('/auth/me');
  return res.data;
};

/**
 * Lightweight non-blocking warmup request to wake sleeping Render instance
 * @returns {Promise<Object|null>}
 */
export const warmupBackend = async () => {
  try {
    const res = await apiClient.get('/health', { timeout: 45000 });
    return res;
  } catch {
    // Fire-and-forget: silently ignore warmup errors
    return null;
  }
};
