import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import config from '../config/env.js';
import { signToken } from '../utils/jwt.js';
import { runInTransaction } from '../utils/transaction.js';
import { toUserDTO } from '../utils/serializers.js';
import { createWalletForUser } from './walletService.js';
import { ACCOUNT_STATUSES } from '../constants/roles.js';

// Used to keep login timing similar whether or not the email exists.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', config.bcryptRounds);

/** Creates the user AND their empty wallet in one transaction (never one without the other). */
export const register = async ({ name, email, password }) => {
  const existingUser = await User.exists({ email });

  if (existingUser) {
    throw new AppError('An account with this email already exists.', 409, 'EMAIL_TAKEN');
  }

  const passwordHash = await bcrypt.hash(password, config.bcryptRounds);

  try {
    const user = await runInTransaction(undefined, async (session) => {
      // role and accountStatus are NOT taken from the client - defaults apply.
      const [createdUser] = await User.create([{ name, email, passwordHash }], { session });
      await createWalletForUser(createdUser._id, { session });
      return createdUser;
    });

    return { user: toUserDTO(user), token: signToken(user) };
  } catch (error) {
    // Two simultaneous sign-ups with the same email: the unique index catches the loser.
    if (error?.code === 11000) {
      throw new AppError('An account with this email already exists.', 409, 'EMAIL_TAKEN');
    }
    throw error;
  }
};

export const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+passwordHash');

  const passwordMatches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

  // Same message for "no such email" and "wrong password" (no account enumeration).
  if (!user || !passwordMatches) {
    throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  if (user.accountStatus !== ACCOUNT_STATUSES.ACTIVE) {
    throw new AppError('Your account is not active. Please contact support.', 403, 'ACCOUNT_INACTIVE');
  }

  return { user: toUserDTO(user), token: signToken(user) };
};

export const getProfile = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  }

  return toUserDTO(user);
};
