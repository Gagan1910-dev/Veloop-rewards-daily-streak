import * as streakService from '../services/streak.service.js';

/**
 * @route   GET /api/daily-streak
 * @desc    Get complete server-authoritative Daily Streak state & card statuses
 * @access  Private (JWT Required)
 */
export const getStreak = async (req, res, next) => {
  try {
    const status = await streakService.getStreakStatus(req.user.id);
    return res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        code: error.code
      });
    }
    next(error);
  }
};

/**
 * @route   POST /api/daily-streak/claim
 * @desc    Claim eligible daily reward (server-authoritative; disregards client input)
 * @access  Private (JWT Required)
 */
export const claimStreak = async (req, res, next) => {
  try {
    const reqContext = {
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      body: req.body // passed only for audit/logging of tampering attempts
    };

    const result = await streakService.claimDailyReward(req.user.id, reqContext);
    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        code: error.code,
        nextClaimAt: error.nextClaimAt || null
      });
    }
    next(error);
  }
};

/**
 * @route   GET /api/daily-streak/history
 * @desc    Get user check-in and claim ledger history
 * @access  Private (JWT Required)
 */
export const getHistory = async (req, res, next) => {
  try {
    const history = await streakService.getStreakHistory(req.user.id);
    return res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};
