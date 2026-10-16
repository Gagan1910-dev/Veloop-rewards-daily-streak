import { isDbConnected } from '../config/db.js';

/**
 * Database readiness middleware
 * Intercepts requests when the database connection is offline or reconnecting,
 * returning an immediate, user-friendly 503 instead of buffering or crashing.
 */
export const requireDbConnection = (req, res, next) => {
  // Allow health checks to proceed regardless of DB state
  if (req.path === '/health' || req.path === '/ready') {
    return next();
  }

  if (!isDbConnected()) {
    return res.status(503).json({
      success: false,
      code: 'DATABASE_UNAVAILABLE',
      message: "We're having trouble connecting right now. Please try again shortly."
    });
  }

  next();
};
