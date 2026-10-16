import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'node:dns';

// Fix local ISP SRV lookup failures (ESERVFAIL) by resolving via public Google & Cloudflare DNS
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {
  // Safe fallback in restricted environments
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env explicitly from backend root or process working directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

import app from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { seedRewards } from './seed/seedRewards.js';

const PORT = process.env.PORT || 5000;
let serverInstance = null;

const startServer = async () => {
  if (!process.env.MONGO_URI && process.env.NODE_ENV === 'production') {
    console.error('[Configuration Error] MONGO_URI is missing in production environment. Startup halted.');
    process.exit(1);
  }

  try {
    await connectDB();

    // Auto-seed default rewards and evaluator demo user on clean startup
    try {
      await seedRewards();
    } catch (seedErr) {
      console.warn('[Startup Warning] Reward seeding check completed:', seedErr.message);
    }

    serverInstance = app.listen(PORT, () => {
      console.log(`[VELoop Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (err) {
    console.error('[Startup Error] Database connection failed on startup:', err.message);
    if (process.env.NODE_ENV === 'production') {
      console.error('[Startup Error] In production, verify that MongoDB Atlas Network Access includes 0.0.0.0/0 (or your server IP).');
      process.exit(1);
    }
  }
};

// Graceful shutdown handlers
const handleShutdown = async (signal) => {
  console.log(`[Server] Received ${signal}. Initiating graceful shutdown...`);

  if (serverInstance) {
    serverInstance.close(() => {
      console.log('[Server] HTTP listener closed.');
    });
  }

  try {
    await disconnectDB();
    console.log('[Server] Graceful shutdown completed cleanly.');
    process.exit(0);
  } catch (err) {
    console.error('[Server Error] Error during shutdown:', err.message);
    process.exit(1);
  }
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

startServer();
