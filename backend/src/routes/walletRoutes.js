import { Router } from 'express';
import * as walletController from '../controllers/walletController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import {
  transactionsQuerySchema,
  adminCreditSchema,
  adminDebitSchema,
} from '../validators/walletValidators.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Every wallet route requires a valid JWT.
router.use(authenticate);

// --- User routes (own wallet only) ---
router.get('/', walletController.getWallet);
router.get('/transactions', validate(transactionsQuerySchema, 'query'), walletController.getTransactions);
router.get('/summary', walletController.getSummary);

// --- Internal / admin routes ---
router.post('/credit', authorize(ROLES.ADMIN), validate(adminCreditSchema), walletController.creditWallet);
router.post('/debit', authorize(ROLES.ADMIN), validate(adminDebitSchema), walletController.debitWallet);

export default router;
