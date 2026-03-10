import express from 'express';
const router = express.Router();
import withdrawalController from '../controllers/withdrawalController.js';
import { protect } from '../middlewares/authMiddleware.js';
import adminAuthMiddleware from '../middlewares/adminAuthMiddleware.js';

// USER ROUTES
router.get('/stats', protect, withdrawalController.getWithdrawalStats);
router.post('/request', protect, withdrawalController.requestWithdrawal);
router.get('/', protect, withdrawalController.getUserWithdrawals);

// ADMIN ROUTES — must be before /:id
router.get('/admin/pending', adminAuthMiddleware, withdrawalController.getPendingWithdrawals);
router.post('/admin/:id/approve', adminAuthMiddleware, withdrawalController.approveWithdrawal);
router.post('/admin/:id/reject', adminAuthMiddleware, withdrawalController.rejectWithdrawal);

// DYNAMIC PARAM ROUTES — always last
router.get('/:id', protect, withdrawalController.getWithdrawalById);
router.post('/:id/cancel', protect, withdrawalController.cancelWithdrawal);

export default router;