import bcrypt from 'bcryptjs';
import config from '../src/config/env.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import { createWalletForUser } from '../src/services/walletService.js';
import { runInTransaction } from '../src/utils/transaction.js';
import { ROLES, ACCOUNT_STATUSES } from '../src/constants/roles.js';

/**
 * Creates an admin user (or promotes an existing user to admin).
 * Admins can NEVER be created through the public /register route.
 *
 * Usage: set ADMIN_EMAIL and ADMIN_PASSWORD in .env, then run `npm run seed:admin`.
 */
const run = async () => {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password || password.length < 8) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (min 8 characters) in your .env file.');
  }

  await connectDB();

  const existing = await User.findOne({ email });

  if (existing) {
    existing.role = ROLES.ADMIN;
    existing.accountStatus = ACCOUNT_STATUSES.ACTIVE;
    await existing.save();
    console.log(`[seed] Existing user ${email} promoted to admin.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, config.bcryptRounds);

  await runInTransaction(undefined, async (session) => {
    const [admin] = await User.create(
      [{ name: 'Demo Admin', email, passwordHash, role: ROLES.ADMIN }],
      { session },
    );
    await createWalletForUser(admin._id, { session });
  });

  console.log(`[seed] Admin user ${email} created.`);
};

run()
  .catch((error) => {
    console.error('[seed] Failed:', error.message);
    process.exitCode = 1;
  })
  .finally(disconnectDB);
