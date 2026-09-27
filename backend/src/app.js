import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.routes.js';
import streakRoutes from './routes/streak.routes.js';
import { generalApiLimiter } from './middleware/rateLimiter.middleware.js';

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
app.use(morgan('dev'));

// Foundation Health Check Endpoint (Exempt from Rate Limiting)
const healthCheckHandler = (req, res) => {
  res.status(200).json({
    success: true,
    status: 'online',
    service: 'VELoop Rewards API',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    serverTime: new Date().toISOString()
  });
};

app.get('/health', healthCheckHandler);
app.get('/api/health', healthCheckHandler);

// Mount General Rate Limiter on all /api routes
app.use('/api', generalApiLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/daily-streak', streakRoutes);

// Centralized 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.originalUrl}`
  });
});

// Centralized Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

export default app;
