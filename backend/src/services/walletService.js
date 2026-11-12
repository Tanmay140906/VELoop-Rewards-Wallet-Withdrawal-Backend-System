import Wallet from '../models/Wallet.js';
import WalletTransaction from '../models/WalletTransaction.js';
import AppError from '../utils/AppError.js';
import { runInTransaction } from '../utils/transaction.js';
import { toWalletDTO, toTransactionDTO } from '../utils/serializers.js';
import { CURRENCIES } from '../constants/currencies.js';
import {
  TRANSACTION_TYPES,
  CREDIT_SOURCES,
  DEBIT_SOURCES,
  MAX_TRANSACTION_AMOUNT,
} from '../constants/transactions.js';

/* ------------------------------------------------------------------ */
/* Internal guards - the service never trusts its callers' input       */
/* ------------------------------------------------------------------ */

const resolveCurrency = (code) => {
  const currency = CURRENCIES[code];

  if (!currency) {
    throw new AppError('Unsupported currency.', 400, 'INVALID_CURRENCY');
  }

  return currency;
};

const assertValidAmount = (amount) => {
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > MAX_TRANSACTION_AMOUNT) {
    throw new AppError('Amount must be a positive whole number.', 400, 'INVALID_AMOUNT');
  }
};

const assertValidSource = (type, source) => {
  const allowedSources = type === TRANSACTION_TYPES.CREDIT ? CREDIT_SOURCES : DEBIT_SOURCES;

  if (!allowedSources.includes(source)) {
    throw new AppError(`Invalid ${type.toLowerCase()} source.`, 400, 'INVALID_SOURCE');
  }
};

const insufficientBalanceError = (currency) =>
  new AppError(`Insufficient ${currency.label} balance.`, 400, 'INSUFFICIENT_BALANCE');

/* ------------------------------------------------------------------ */
/* Wallet creation / reading                                           */
/* ------------------------------------------------------------------ */

/** Creates the (empty) wallet for a new user. Pass a session to join a transaction. */
export const createWalletForUser = async (userId, { session } = {}) => {
  const [wallet] = await Wallet.create([{ userId }], { session });
  return wallet;
};

/** Returns the current wallet of a user. */
export const getWallet = async (userId) => {
  const wallet = await Wallet.findOne({ userId }).lean();

  if (!wallet) {
    throw new AppError('Wallet not found.', 404, 'WALLET_NOT_FOUND');
  }

  return toWalletDTO(wallet);
};

/**
 * ADVISORY check: returns the current balance, or throws "Insufficient ... balance."
 * Use it for early, friendly rejection only. It is NOT a safe guard on its own
 * (the balance can change right after this call) - debitWallet() is the real guard.
 */
export const validateBalance = async (userId, currencyCode, requiredAmount, { session } = {}) => {
  const currency = resolveCurrency(currencyCode);
  assertValidAmount(requiredAmount);

  const wallet = await Wallet.findOne({ userId }).session(session ?? null).lean();

  if (!wallet) {
    throw new AppError('Wallet not found.', 404, 'WALLET_NOT_FOUND');
  }

  if (wallet[currency.field] < requiredAmount) {
    throw insufficientBalanceError(currency);
  }

  return wallet[currency.field];
};

/* ------------------------------------------------------------------ */
/* Ledger                                                              */
/* ------------------------------------------------------------------ */

/** Writes ONE ledger record. Always call it in the same transaction as the balance change. */
export const createLedgerEntry = async (entry, { session } = {}) => {
  const [transaction] = await WalletTransaction.create(
    [
      {
        userId: entry.userId,
        currency: entry.currency,
        type: entry.type,
        source: entry.source,
        amount: entry.amount,
        balanceBefore: entry.balanceBefore,
        balanceAfter: entry.balanceAfter,
        referenceId: entry.referenceId ?? null,
        status: entry.status ?? 'COMPLETED',
        description: entry.description ?? '',
        metadata: entry.metadata ?? {},
      },
    ],
    { session },
  );

  return transaction;
};

/* ------------------------------------------------------------------ */
/* Credit / Debit (atomic)                                             */
/* ------------------------------------------------------------------ */

/**
 * Adds `amount` to a balance and records a CREDIT ledger entry.
 * Balance update + ledger entry succeed or fail together.
 * Pass `session` to make it part of a larger transaction.
 */
export const creditWallet = async (params, { session } = {}) => {
  const { userId, currency: currencyCode, amount, source } = params;
  const { referenceId = null, description = '', metadata = {} } = params;

  const currency = resolveCurrency(currencyCode);
  assertValidAmount(amount);
  assertValidSource(TRANSACTION_TYPES.CREDIT, source);

  return runInTransaction(session, async (activeSession) => {
    // $inc is atomic: concurrent credits can never overwrite each other.
    const wallet = await Wallet.findOneAndUpdate(
      { userId },
      { $inc: { [currency.field]: amount } },
      { returnDocument: 'after', session: activeSession },
    );

    if (!wallet) {
      throw new AppError('Wallet not found.', 404, 'WALLET_NOT_FOUND');
    }

    const balanceAfter = wallet[currency.field];

    const transaction = await createLedgerEntry(
      {
        userId,
        currency: currency.code,
        type: TRANSACTION_TYPES.CREDIT,
        source,
        amount,
        balanceBefore: balanceAfter - amount,
        balanceAfter,
        referenceId,
        description,
        metadata,
      },
      { session: activeSession },
    );

    return { wallet: toWalletDTO(wallet), transaction: toTransactionDTO(transaction) };
  });
};

/**
 * Subtracts `amount` from a balance and records a DEBIT ledger entry.
 *
 * The check and the deduction happen in ONE atomic database operation:
 * "subtract only if balance >= amount". There is no read-then-write gap,
 * so two simultaneous requests can never both spend the same balance.
 */
export const debitWallet = async (params, { session } = {}) => {
  const { userId, currency: currencyCode, amount, source } = params;
  const { referenceId = null, description = '', metadata = {} } = params;

  const currency = resolveCurrency(currencyCode);
  assertValidAmount(amount);
  assertValidSource(TRANSACTION_TYPES.DEBIT, source);

  return runInTransaction(session, async (activeSession) => {
    const wallet = await Wallet.findOneAndUpdate(
      { userId, [currency.field]: { $gte: amount } },
      { $inc: { [currency.field]: -amount } },
      { returnDocument: 'after', session: activeSession },
    );

    if (!wallet) {
      // Either the wallet does not exist, or the balance was too low.
      const walletExists = await Wallet.exists({ userId }).session(activeSession);

      if (!walletExists) {
        throw new AppError('Wallet not found.', 404, 'WALLET_NOT_FOUND');
      }

      throw insufficientBalanceError(currency);
    }

    const balanceAfter = wallet[currency.field];

    const transaction = await createLedgerEntry(
      {
        userId,
        currency: currency.code,
        type: TRANSACTION_TYPES.DEBIT,
        source,
        amount,
        balanceBefore: balanceAfter + amount,
        balanceAfter,
        referenceId,
        description,
        metadata,
      },
      { session: activeSession },
    );

    return { wallet: toWalletDTO(wallet), transaction: toTransactionDTO(transaction) };
  });
};

/* ------------------------------------------------------------------ */
/* History                                                             */
/* ------------------------------------------------------------------ */

/** Paginated ledger history for ONE user (newest first). */
export const getTransactions = async (userId, { page = 1, limit = 20, currency, type } = {}) => {
  const filter = { userId };

  if (currency) filter.currency = currency;
  if (type) filter.type = type;

  const [records, total] = await Promise.all([
    WalletTransaction.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    WalletTransaction.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    transactions: records.map(toTransactionDTO),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

/** Everything the Wallet dashboard needs in one call: balances + latest activity. */
export const getWalletSummary = async (userId) => {
  const [wallet, recent] = await Promise.all([
    getWallet(userId),
    getTransactions(userId, { page: 1, limit: 5 }),
  ]);

  return { wallet, recentTransactions: recent.transactions };
};
