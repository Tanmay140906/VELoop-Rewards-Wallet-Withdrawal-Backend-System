import mongoose from 'mongoose';

const TRANSACTION_OPTIONS = Object.freeze({
  readPreference: 'primary',
  readConcern: { level: 'local' },
  writeConcern: { w: 'majority' },
});

/**
 * Runs `work(session)` inside a MongoDB transaction.
 *
 * - If an existing session is passed, the CALLER owns the transaction and
 *   `work` simply joins it. This lets several services (wallet debit +
 *   withdrawal creation + audit log) commit or roll back together.
 * - Otherwise a new session is opened, the work is committed on success and
 *   fully rolled back if `work` throws.
 *
 * NOTE: MongoDB may re-run `work` after a transient error (e.g. a write
 * conflict), so `work` must only touch the database - no emails, no
 * counters in memory, no external API calls.
 */
export const runInTransaction = async (existingSession, work) => {
  if (existingSession) {
    return work(existingSession);
  }

  const session = await mongoose.startSession();

  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    }, TRANSACTION_OPTIONS);
    return result;
  } finally {
    await session.endSession();
  }
};
