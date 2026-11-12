import { CURRENCIES } from '../constants/currencies.js';

/** Shapes database documents into the objects we return to clients. */

export const toUserDTO = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  accountStatus: user.accountStatus,
});

export const toWalletDTO = (wallet) => ({
  ves: wallet.ves,
  sves: wallet.sves,
  gems: wallet.gems,
  tokens: wallet.tokens,
  spins: wallet.spins,
  updatedAt: wallet.updatedAt,
});

export const toTransactionDTO = (transaction) => ({
  transactionId: transaction.transactionId,
  currency: transaction.currency,
  currencyLabel: CURRENCIES[transaction.currency]?.label ?? transaction.currency,
  type: transaction.type,
  source: transaction.source,
  amount: transaction.amount,
  balanceBefore: transaction.balanceBefore,
  balanceAfter: transaction.balanceAfter,
  referenceId: transaction.referenceId,
  status: transaction.status,
  description: transaction.description,
  createdAt: transaction.createdAt,
});
