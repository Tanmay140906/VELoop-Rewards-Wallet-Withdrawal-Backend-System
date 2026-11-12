import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { CURRENCY_CODES } from '../constants/currencies.js';
import { PAYOUT_METHODS, WITHDRAWAL_STATUSES } from '../constants/withdrawal.js';

// Every status change is stored so the full history is preserved.
const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: Object.values(WITHDRAWAL_STATUSES), required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    note: { type: String, default: '' },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const withdrawalSchema = new mongoose.Schema(
  {
    withdrawalId: {
      type: String,
      required: true,
      unique: true,
      default: () => `wd_${randomUUID()}`,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    method: { type: String, enum: PAYOUT_METHODS, required: true },
    optionId: { type: String, required: true },
    currency: { type: String, enum: CURRENCY_CODES, default: 'VES' },
    currencyAmount: { type: Number, required: true, min: 1 }, // VEs deducted (copied from PayoutOption)
    payoutAmount: { type: Number, required: true, min: 1 }, // INR value (copied from PayoutOption)
    payoutDetails: { type: mongoose.Schema.Types.Mixed, default: {} }, // UPI ID / gift-card details
    status: {
      type: String,
      enum: Object.values(WITHDRAWAL_STATUSES),
      default: WITHDRAWAL_STATUSES.PENDING,
    },
    rejectionReason: { type: String, default: null },
    reviewNote: { type: String, default: null },
    idempotencyKey: { type: String, required: true },
    transactionId: { type: String, default: null }, // ledger DEBIT created with the withdrawal
    refundTransactionId: { type: String, default: null }, // ledger CREDIT if rejected (refund once only)
    statusHistory: { type: [statusHistorySchema], default: [] },
    requestedAt: { type: Date, default: Date.now },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true, minimize: false },
);

// Duplicate-request protection: the same user can never reuse an idempotency key
withdrawalSchema.index({ userId: 1, idempotencyKey: 1 }, { unique: true });
// "My withdrawals", newest first
withdrawalSchema.index({ userId: 1, requestedAt: -1 });
// Admin queue by status
withdrawalSchema.index({ status: 1, requestedAt: -1 });
withdrawalSchema.index({ transactionId: 1 });

export default mongoose.model('Withdrawal', withdrawalSchema);
