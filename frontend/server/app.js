import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.routes.js';
import streakRoutes from './routes/streak.routes.js';
import { generalApiLimiter } from './middleware/rateLimiter.middleware.js';
import { requireDbConnection } from './middleware/dbReady.middleware.js';
import { isDbConnected } from './config/db.js';

const app = express();

// Configure trust proxy for reverse-proxy deployment environments (Render, Vercel, Railway, Nginx)
app.set('trust proxy', 1);

// Security and utility middleware
app.use(helmet());

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost')
      ) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true
  })
);

app.use(express.json());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Liveness Probe (always 200 if Node process is responsive)
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'online',
    service: 'VELoop Rewards API',
    uptime: Math.floor(process.uptime()),
    serverTime: new Date().toISOString()
  });
});

// Readiness Probe (checks MongoDB readiness before traffic routing)
const readinessHandler = (req, res) => {
  const ready = isDbConnected();
  if (ready) {
    return res.status(200).json({
      success: true,
      status: 'online',
      readiness: 'ready',
      database: 'connected',
      service: 'VELoop Rewards API',
      serverTime: new Date().toISOString()
    });
  }
  return res.status(503).json({
    success: false,
    status: 'degraded',
    readiness: 'not_ready',
    database: 'disconnected',
    service: 'VELoop Rewards API',
    message: "Database connection is not yet ready.",
    serverTime: new Date().toISOString()
  });
};

app.get('/ready', readinessHandler);
app.get('/api/health', readinessHandler);

// Mount General Rate Limiter on all /api routes
app.use('/api', generalApiLimiter);

// Enforce Database Readiness for all data routes
app.use('/api/auth', requireDbConnection, authRoutes);
app.use('/api/daily-streak', requireDbConnection, streakRoutes);

// Centralized 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    code: 'ROUTE_NOT_FOUND',
    message: `API Route not found: ${req.originalUrl}`
  });
});

// Centralized Error Handler (Strict Sanitization to prevent leaking internals)
app.use((err, req, res, next) => {
  // Safe technical logging on server for diagnostics
  console.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, {
    name: err.name,
    message: err.message,
    statusCode: err.statusCode || err.status || 500
  });

  const statusCode = err.statusCode || err.status || 500;

  // Known validation / client error codes (400, 401, 403, 404, 409, 429)
  if (statusCode >= 400 && statusCode < 500) {
    return res.status(statusCode).json({
      success: false,
      code: err.code || 'CLIENT_ERROR',
      message: err.message || 'Invalid request'
    });
  }

  // Internal or Database Errors (Never leak Mongoose/Mongo internals)
  const isDbOrTimeoutError =
    err.name === 'MongooseError' ||
    err.name === 'MongoServerSelectionError' ||
    err.name === 'MongoNetworkError' ||
    err.name === 'CastError' ||
    /buffering|timeout|econnrefused/i.test(err.message || '');

  if (isDbOrTimeoutError) {
    return res.status(503).json({
      success: false,
      code: 'SERVICE_UNAVAILABLE',
      message: "We're having trouble connecting right now. Please try again shortly."
    });
  }

  return res.status(500).json({
    success: false,
    code: 'INTERNAL_SERVER_ERROR',
    message: "An unexpected error occurred. Please try again later."
  });
});

export default app;
