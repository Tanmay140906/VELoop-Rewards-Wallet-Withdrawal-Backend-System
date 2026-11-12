/** Direction of a ledger entry. */
export const TRANSACTION_TYPES = Object.freeze({
  CREDIT: 'CREDIT',
  DEBIT: 'DEBIT',
});

/**
 * Why the balance changed ("source" in the ledger).
 * Credit and debit sources are kept apart so a CREDIT can never be
 * recorded with a debit-only reason (and vice versa).
 */
export const CREDIT_SOURCES = Object.freeze([
  'REWARD',
  'BONUS',
  'REFERRAL',
  'DAILY_REWARD',
  'AD_REWARD',
  'GAME_REWARD',
  'EXCHANGE_CREDIT',
  'ADMIN_CREDIT',
  'WITHDRAWAL_REFUND', // added: returns VEs when a withdrawal is rejected (Option A)
  'CORRECTION_CREDIT', // added: balance correction that increases a balance
]);

export const DEBIT_SOURCES = Object.freeze([
  'WITHDRAWAL',
  'EXCHANGE_DEBIT',
  'ADMIN_DEBIT',
  'CORRECTION',
]);

export const ALL_SOURCES = Object.freeze([...CREDIT_SOURCES, ...DEBIT_SOURCES]);

/** Sources an admin is allowed to use through the manual credit/debit API. */
export const ADMIN_CREDIT_SOURCES = Object.freeze(['ADMIN_CREDIT', 'CORRECTION_CREDIT']);
export const ADMIN_DEBIT_SOURCES = Object.freeze(['ADMIN_DEBIT', 'CORRECTION']);

export const TRANSACTION_STATUSES = Object.freeze(['COMPLETED', 'PENDING', 'FAILED']);

/** Upper bound for a single wallet operation (sanity limit). */
export const MAX_TRANSACTION_AMOUNT = 10_000_000;
