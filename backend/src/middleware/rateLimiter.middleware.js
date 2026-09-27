import { rateLimit } from 'express-rate-limit';

/**
 * General API Rate Limiter
 * Applied across all /api routes
 * Window: 15 minutes, Max: 200 requests per IP
 */
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  skip: () => process.env.NODE_ENV === 'test'
});

/**
 * Authentication Rate Limiter
 * Applied specifically to POST /api/auth/login and POST /api/auth/register
 * Window: 15 minutes, Max: 20 requests per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  skip: () => process.env.NODE_ENV === 'test'
});

/**
 * Claim Action Rate Limiter
 * Applied specifically to POST /api/daily-streak/claim
 * Window: 1 minute, Max: 30 requests per IP
 */
export const claimLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many claim attempts in a short period. Please wait a moment before trying again.',
    code: 'CLAIM_RATE_LIMIT_EXCEEDED'
  },
  skip: () => process.env.NODE_ENV === 'test'
});
