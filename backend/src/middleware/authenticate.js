import mongoose from 'mongoose';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyToken } from '../utils/jwt.js';
import { ACCOUNT_STATUSES } from '../constants/roles.js';

const authRequired = () => new AppError('Authentication required.', 401, 'AUTH_REQUIRED');

/**
 * Identifies the user from the JWT and attaches req.user.
 * The user's role and status are loaded from the database on every request,
 * so suspending an account takes effect immediately.
 */
export const authenticate = asyncHandler(async (req, _res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw authRequired();
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw authRequired();
  }

  if (!mongoose.isValidObjectId(payload.sub)) {
    throw authRequired();
  }

  const user = await User.findById(payload.sub).select('name email role accountStatus').lean();

  if (!user) {
    throw authRequired();
  }

  if (user.accountStatus !== ACCOUNT_STATUSES.ACTIVE) {
    throw new AppError('Your account is not active. Please contact support.', 403, 'ACCOUNT_INACTIVE');
  }

  req.user = { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
  next();
});
