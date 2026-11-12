import { z } from 'zod';
import { CURRENCIES, CURRENCY_CODES } from '../constants/currencies.js';
import {
  TRANSACTION_TYPES,
  ADMIN_CREDIT_SOURCES,
  ADMIN_DEBIT_SOURCES,
  MAX_TRANSACTION_AMOUNT,
} from '../constants/transactions.js';
import { objectIdSchema } from './common.js';

const currencySchema = z
  .string()
  .trim()
  .toUpperCase()
  .refine((value) => CURRENCY_CODES.includes(value), {
    message: `Currency must be one of: ${CURRENCY_CODES.map((code) => CURRENCIES[code].label).join(', ')}.`,
  });

const amountSchema = z
  .number()
  .int('Amount must be a whole number.')
  .positive('Amount must be greater than 0.')
  .max(MAX_TRANSACTION_AMOUNT, `Amount cannot exceed ${MAX_TRANSACTION_AMOUNT}.`);

const descriptionSchema = z
  .string()
  .trim()
  .min(3, 'A reason is required for manual wallet changes.')
  .max(200, 'Description is too long.');

const referenceIdSchema = z.string().trim().min(1).max(100).optional();

/** GET /api/wallet/transactions?page=1&limit=20 */
export const transactionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1, 'page must be at least 1.').default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1, 'limit must be at least 1.')
    .max(100, 'limit cannot be more than 100.')
    .default(20),
  currency: currencySchema.optional(),
  type: z
    .string()
    .trim()
    .toUpperCase()
    .refine((value) => Object.values(TRANSACTION_TYPES).includes(value), {
      message: 'type must be CREDIT or DEBIT.',
    })
    .optional(),
});

/** POST /api/wallet/credit (admin only) */
export const adminCreditSchema = z.object({
  userId: objectIdSchema,
  currency: currencySchema,
  amount: amountSchema,
  source: z.enum(ADMIN_CREDIT_SOURCES).default('ADMIN_CREDIT'),
  description: descriptionSchema,
  referenceId: referenceIdSchema,
});

/** POST /api/wallet/debit (admin only) */
export const adminDebitSchema = z.object({
  userId: objectIdSchema,
  currency: currencySchema,
  amount: amountSchema,
  source: z.enum(ADMIN_DEBIT_SOURCES).default('ADMIN_DEBIT'),
  description: descriptionSchema,
  referenceId: referenceIdSchema,
});
