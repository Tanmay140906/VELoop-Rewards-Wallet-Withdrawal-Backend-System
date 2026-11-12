import { Router } from 'express';
import authRoutes from './authRoutes.js';
import walletRoutes from './walletRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/wallet', walletRoutes);

export default router;
