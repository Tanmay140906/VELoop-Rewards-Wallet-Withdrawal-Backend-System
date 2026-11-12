import mongoose from 'mongoose';
import config from './env.js';
import * as models from '../models/index.js';

let connectionPromise = null;

/**
 * Connects to MongoDB once and reuses the connection.
 * Safe to call many times: on a normal server (server.js) it runs once at startup,
 * on a serverless host (Vercel) it runs on the first request of each instance.
 */
export const connectDB = () => {
  connectionPromise ??= (async () => {
    mongoose.set('strictQuery', true);

    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 10000 });

    // Create every collection and build every index BEFORE serving traffic.
    // This matters for two reasons:
    //  1. Unique indexes (email, transactionId, idempotency key...) must exist
    //     or duplicates are possible.
    //  2. MongoDB transactions can fail if a collection is created lazily
    //     in the middle of a transaction on a fresh database.
    await Promise.all(Object.values(models).map((Model) => Model.init()));

    console.log(`[db] Connected to MongoDB database "${mongoose.connection.name}"`);
  })().catch((error) => {
    connectionPromise = null; // allow a retry on the next request
    throw error;
  });

  return connectionPromise;
};

export const disconnectDB = async () => {
  connectionPromise = null;
  await mongoose.disconnect();
};