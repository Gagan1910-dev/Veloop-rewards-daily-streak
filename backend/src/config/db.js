import mongoose from 'mongoose';
import dns from 'node:dns';

try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {
  // Safe fallback
}

export const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI || 'mongodb://localhost:27017/veloop_rewards';
  const localFallbackUri = 'mongodb://localhost:27017/veloop_rewards';

  try {
    const conn = await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 4000 });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    if (primaryUri !== localFallbackUri) {
      console.warn(`[Database Warning] Primary connection failed (${error.message}). Attempting local MongoDB fallback...`);
      try {
        const localConn = await mongoose.connect(localFallbackUri, { serverSelectionTimeoutMS: 3000 });
        console.log(`[Database] Connected to Local MongoDB: ${localConn.connection.host}`);
        return localConn;
      } catch (localErr) {
        console.error(`[Database Error] Local fallback failed: ${localErr.message}`);
        throw error;
      }
    }
    throw error;
  }
};
