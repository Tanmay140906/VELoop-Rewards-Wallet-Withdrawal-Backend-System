import { connectDB } from '../config/db.js';

/** Makes sure MongoDB is connected before a request reaches the routes (needed on serverless hosts). */
export const ensureDbConnection = async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
};