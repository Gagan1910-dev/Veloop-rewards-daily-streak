import express from 'express';
import { getStreak, claimStreak, getHistory } from '../controllers/streak.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { claimLimiter } from '../middleware/rateLimiter.middleware.js';

const router = express.Router();

// All daily streak endpoints require verified JWT authentication
router.use(requireAuth);

router.get('/', getStreak);
router.post('/claim', claimLimiter, claimStreak);
router.get('/history', getHistory);

export default router;
