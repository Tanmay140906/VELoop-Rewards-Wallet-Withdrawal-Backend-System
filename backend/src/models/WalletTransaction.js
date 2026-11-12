import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { CURRENCY_CODES } from '../constants/currencies.js';
import {
  TRANSACTION_TYPES,
  ALL_SOURCES,
  TRANSACTION_STATUSES,
} from '../constants/transactions.js';
import { enforceAppendOnly } from '../utils/appendOnly.js';

const integerValidator = { validator: Number.isInteger, message: '{PATH} must be a whole number.' };

/**
 * The wallet ledger. One document per balance change.
 * Append-only: entries are never edited or deleted.
 */
const walletTransactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      default: () => `txn_${randomUUID()}`,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    currency: { type: String, enum: CURRENCY_CODES, required: true },
    type: { type: String, enum: Object.values(TRANSACTION_TYPES), required: true },
    source: { type: String, enum: ALL_SOURCES, required: true },
    amount: { type: Number, required: true, min: 1, validate: integerValidator },
    balanceBefore: { type: Number, required: true, min: 0, validate: integerValidator },
    balanceAfter: { type: Number, required: true, min: 0, validate: integerValidator },
    referenceId: { type: String, default: null, trim: true },
    status: { type: String, enum: TRANSACTION_STATUSES, default: 'COMPLETED' },
    description: { type: String, default: '', trim: true, maxlength: 200 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, minimize: false },
);

// Wallet history for one user, newest first (the main query)
walletTransactionSchema.index({ userId: 1, createdAt: -1, _id: -1 });
// Look up everything linked to a withdrawal / external reference
walletTransactionSchema.index({ referenceId: 1 });
walletTransactionSchema.index({ status: 1 });
walletTransactionSchema.index({ createdAt: -1 });

enforceAppendOnly(walletTransactionSchema, 'WalletTransaction');

export default mongoose.model('WalletTransaction', walletTransactionSchema);
