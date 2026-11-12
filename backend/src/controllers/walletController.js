import * as walletService from '../services/walletService.js';
import * as adminWalletService from '../services/adminWalletService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getRequestContext } from '../utils/requestContext.js';

// IMPORTANT: every handler below uses req.user.id (from the verified JWT).
// The user id is NEVER read from the body, query string or URL for user routes.

export const getWallet = asyncHandler(async (req, res) => {
  const wallet = await walletService.getWallet(req.user.id);

  res.status(200).json({ success: true, wallet });
});

export const getTransactions = asyncHandler(async (req, res) => {
  const result = await walletService.getTransactions(req.user.id, req.validated.query);

  res.status(200).json({ success: true, ...result });
});

export const getSummary = asyncHandler(async (req, res) => {
  const summary = await walletService.getWalletSummary(req.user.id);

  res.status(200).json({ success: true, ...summary });
});

/* ---------------- Admin-only (see walletRoutes.js) ---------------- */

export const creditWallet = asyncHandler(async (req, res) => {
  const result = await adminWalletService.adminCreditWallet({
    actor: req.user,
    input: req.validated.body,
    context: getRequestContext(req),
  });

  res.status(201).json({ success: true, message: 'Wallet credited successfully.', ...result });
});

export const debitWallet = asyncHandler(async (req, res) => {
  const result = await adminWalletService.adminDebitWallet({
    actor: req.user,
    input: req.validated.body,
    context: getRequestContext(req),
  });

  res.status(201).json({ success: true, message: 'Wallet debited successfully.', ...result });
});
