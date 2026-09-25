import apiClient from './apiClient.js';

/**
 * Fetch server-authoritative streak state, 7-day reward configuration, card statuses, and timestamps
 * @returns {Promise<Object>} Streak status response
 */
export const getDailyStreak = async () => {
  const res = await apiClient.get('/daily-streak');
  return res.data;
};

/**
 * Claim today's eligible daily streak reward
 * IMPORTANT: No client-side body (e.g. day, amount, currency, userId) is sent.
 * The backend derives all values authoritatively from the authenticated session.
 * @returns {Promise<Object>} Claim confirmation, updated streak, and updated wallet
 */
export const claimDailyReward = async () => {
  // Empty payload: Backend is 100% authoritative
  const res = await apiClient.post('/daily-streak/claim', {});
  return res;
};

/**
 * Fetch user's check-in and transaction ledger history
 * @returns {Promise<Array>} Check-in records list
 */
export const getStreakHistory = async () => {
  const res = await apiClient.get('/daily-streak/history');
  return res.data;
};
