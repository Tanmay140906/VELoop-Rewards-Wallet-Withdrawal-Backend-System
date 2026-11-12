import mongoose from 'mongoose';
import config from './env.js';
import * as models from '../models/index.js';

export const connectDB = async () => {
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
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
};
