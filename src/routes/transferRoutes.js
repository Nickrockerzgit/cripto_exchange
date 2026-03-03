// src/routes/transferRoutes.js
import express from 'express';
const router = express.Router();
import transferController from '../controllers/transferController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

// All routes require authentication
router.use(authMiddleware);

// Execute transfer
router.post('/', transferController.executeTransfer);

// Get transfer history
router.get('/history', transferController.getTransferHistory);

// Get transfer statistics
router.get('/stats', transferController.getTransferStats);

// Search for receiver
router.post('/search-receiver', transferController.searchReceiver);

// Get transfer by ID
router.get('/:id', transferController.getTransferById);

export default router;
