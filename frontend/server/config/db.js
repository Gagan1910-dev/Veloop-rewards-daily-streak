import mongoose from 'mongoose';
import dns from 'node:dns';

// Fix local ISP SRV lookup failures (ESERVFAIL) by resolving via public Google & Cloudflare DNS
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {
  // Safe fallback in restricted environments
}

// Disable Mongoose query buffering globally so operations fail fast instead of hanging 10 seconds
mongoose.set('bufferCommands', false);

// Connection event listeners for observability
let isEventListenersAttached = false;
function attachConnectionListeners() {
  if (isEventListenersAttached) return;
  isEventListenersAttached = true;

  mongoose.connection.on('connected', () => {
    console.log('[Database] MongoDB connection established successfully.');
  });

  mongoose.connection.on('error', (err) => {
    console.error('[Database Error] Connection error occurred:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database Warning] MongoDB disconnected.');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('[Database] MongoDB reconnected.');
  });
}

/**
 * Returns true if MongoDB is in readyState 1 (connected)
 */
export const isDbConnected = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * Establish resilient, bounded MongoDB connection
 */
export const connectDB = async () => {
  if (isDbConnected()) {
    return mongoose.connection;
  }

  attachConnectionListeners();

  const isProduction = process.env.NODE_ENV === 'production';
  const primaryUri = process.env.MONGO_URI;
  const localFallbackUri = 'mongodb://localhost:27017/veloop_rewards';

  const connectionUri = primaryUri || localFallbackUri;

  const connectionOptions = {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 2
  };

  try {
    const conn = await mongoose.connect(connectionUri, connectionOptions);
    console.log('[Database] Connected to MongoDB cluster successfully.');
    return conn;
  } catch (error) {
    console.error('[Database Error] Failed to connect to primary MongoDB:', error.message);

    // In non-production environments, attempt local fallback if primary was a remote URI
    if (!isProduction && primaryUri && primaryUri !== localFallbackUri) {
      console.warn('[Database] Development mode detected: attempting local MongoDB fallback (localhost:27017)...');
      try {
        const localConn = await mongoose.connect(localFallbackUri, {
          ...connectionOptions,
          serverSelectionTimeoutMS: 3000
        });
        console.log('[Database] Connected to Local MongoDB fallback successfully.');
        return localConn;
      } catch (localErr) {
        console.error('[Database Error] Local MongoDB fallback failed:', localErr.message);
        throw error;
      }
    }

    throw error;
  }
};

/**
 * Graceful database disconnect
 */
export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close(false);
    console.log('[Database] MongoDB connection closed gracefully.');
  }
};
