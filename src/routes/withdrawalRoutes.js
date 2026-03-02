import express from 'express';
const router = express.Router();
import withdrawalController from '../controllers/withdrawalController.js';
import { protect } from '../middlewares/authMiddleware.js';

// All routes require authentication
router.use(protect);

// Get withdrawal statistics
router.get('/stats', withdrawalController.getWithdrawalStats);

// Process principal withdrawals (Admin only - should add admin middleware)
router.post('/process-principal', withdrawalController.processPrincipalWithdrawals);

// Get user withdrawals
router.get('/', withdrawalController.getUserWithdrawals);

// Get single withdrawal
router.get('/:id', withdrawalController.getWithdrawalById);

// Cancel pending withdrawal
router.post('/:id/cancel', withdrawalController.cancelWithdrawal);

export default router;
