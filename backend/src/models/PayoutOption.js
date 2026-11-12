import mongoose from 'mongoose';
import { CURRENCY_CODES } from '../constants/currencies.js';
import { PAYOUT_METHODS } from '../constants/withdrawal.js';

/**
 * Payout configuration stored in the database (seeded on Day 6).
 * Changing "requiredAmount" here changes the price for every client
 * without rebuilding the frontend.
 */
const payoutOptionSchema = new mongoose.Schema(
  {
    optionId: { type: String, required: true, unique: true, trim: true }, // e.g. "upi_100"
    method: { type: String, enum: PAYOUT_METHODS, required: true },
    label: { type: String, required: true, trim: true }, // e.g. "₹100"
    currency: { type: String, enum: CURRENCY_CODES, default: 'VES' },
    payoutValue: { type: Number, required: true, min: 1 }, // INR value paid out
    requiredAmount: { type: Number, required: true, min: 1 }, // VEs needed
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    eligibility: { type: mongoose.Schema.Types.Mixed, default: {} },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, minimize: false },
);

payoutOptionSchema.index({ method: 1, active: 1, sortOrder: 1 });

export default mongoose.model('PayoutOption', payoutOptionSchema);
