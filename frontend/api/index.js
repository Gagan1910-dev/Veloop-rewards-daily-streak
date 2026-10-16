import dns from 'node:dns';
import mongoose from 'mongoose';
import app from '../server/app.js';
import { seedRewards } from '../server/seed/seedRewards.js';

// Fallback public DNS resolvers to handle SRV lookups reliably
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {
  // Safe fallback
}

// Disable query buffering so operations fail fast when disconnected
mongoose.set('bufferCommands', false);

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb+srv://gagan:12345@cluster0.oihtr6g.mongodb.net/veloop_rewards?retryWrites=true&w=majority&appName=Cluster0';

process.env.MONGO_URI = MONGO_URI;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'veloop_jwt_dev_secret_key_2026_9b8c7e6a5d4c3b2a';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

let isConnected = false;

async function ensureDbConnected() {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 30000,
    maxPoolSize: 5
  });
  isConnected = true;
  console.log('[Vercel API] MongoDB Atlas connected successfully');
  try {
    await seedRewards();
  } catch (seedErr) {
    console.warn('[Vercel API] Seed check completed:', seedErr.message);
  }
}

export default async function handler(req, res) {
  try {
    await ensureDbConnected();
  } catch (err) {
    // Safe technical logging on server for observability
    console.error('[Vercel API] Database connection error:', err.message);
    return res.status(503).json({
      success: false,
      code: 'SERVICE_UNAVAILABLE',
      message: "We're having trouble connecting right now. Please try again shortly."
    });
  }
  return app(req, res);
}
