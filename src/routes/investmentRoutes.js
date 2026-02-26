import express from 'express';
const router = express.Router();
import investmentController from '../controllers/investmentController.js';
import { protect } from '../middlewares/authMiddleware.js';

// All routes require authentication
router.use(protect);

// Get all investment plans
router.get('/plans', investmentController.getInvestmentPlans);

// Get investment summary
router.get('/summary', investmentController.getInvestmentSummary);

// Get user investments
router.get('/', investmentController.getUserInvestments);

// Get single investment
router.get('/:id', investmentController.getInvestmentById);

// Create new investment
router.post('/', investmentController.createInvestment);

// Withdraw profit
router.post('/withdraw-profit', investmentController.withdrawProfit);

// Withdraw principal (only on 28th)
router.post('/withdraw-principal', investmentController.withdrawPrincipal);

export default router;
