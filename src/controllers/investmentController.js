import investmentService from '../services/investment.service.js';
import { successResponse } from '../utils/successResponse.js';
import { errorResponse } from '../utils/errorResponse.js';

class InvestmentController {
  /**
   * Create new investment
   * POST /api/investments
   */
  async createInvestment(req, res) {
    try {
      const userId = req.user.userId || req.user.id;
      const { plan_id, amount } = req.body;

      if (!plan_id || !amount) {
        return errorResponse(res, 'Plan ID and amount are required', 400);
      }

      if (amount <= 0) {
        return errorResponse(res, 'Amount must be greater than 0', 400);
      }

      const investment = await investmentService.createInvestment(userId, plan_id, amount);

      return successResponse(
        res,
        'Investment created successfully',
        investment,
        201
      );
    } catch (error) {
      console.error('Create investment error:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Get user investments
   * GET /api/investments
   */
  async getUserInvestments(req, res) {
    try {
      const userId = req.user.userId || req.user.id;
      const { status } = req.query;

      const investments = await investmentService.getUserInvestments(userId, status);

      return successResponse(
        res,
        'Investments retrieved successfully',
        investments
      );
    } catch (error) {
      console.error('Get investments error:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Get single investment
   * GET /api/investments/:id
   */
  async getInvestmentById(req, res) {
    try {
      const userId = req.user.userId || req.user.id;
      const { id } = req.params;

      const investment = await investmentService.getInvestmentById(id, userId);

      return successResponse(
        res,
        'Investment retrieved successfully',
        investment
      );
    } catch (error) {
      console.error('Get investment error:', error);
      return errorResponse(res, error.message, 404);
    }
  }

  /**
   * Get investment summary
   * GET /api/investments/summary
   */
  async getInvestmentSummary(req, res) {
    try {
      const userId = req.user.userId || req.user.id;

      const summary = await investmentService.getInvestmentSummary(userId);

      return successResponse(
        res,
        'Investment summary retrieved successfully',
        summary
      );
    } catch (error) {
      console.error('Get investment summary error:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Withdraw profit
   * POST /api/investments/withdraw-profit
   */
  async withdrawProfit(req, res) {
    try {
      const userId = req.user.userId || req.user.id;
      const { amount } = req.body;

      if (!amount) {
        return errorResponse(res, 'Amount is required', 400);
      }

      if (amount <= 0) {
        return errorResponse(res, 'Amount must be greater than 0', 400);
      }

      const withdrawal = await investmentService.withdrawProfit(userId, amount);

      return successResponse(
        res,
        'Profit withdrawal request submitted successfully',
        withdrawal,
        201
      );
    } catch (error) {
      console.error('Withdraw profit error:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Withdraw principal (only on 28th)
   * POST /api/investments/withdraw-principal
   */
  async withdrawPrincipal(req, res) {
    try {
      const userId = req.user.userId || req.user.id;
      const { amount } = req.body;

      if (!amount) {
        return errorResponse(res, 'Amount is required', 400);
      }

      if (amount <= 0) {
        return errorResponse(res, 'Amount must be greater than 0', 400);
      }

      const result = await investmentService.withdrawPrincipal(userId, amount);

      return successResponse(
        res,
        'Principal withdrawal request submitted successfully. Processing will occur between 1st-5th of next month.',
        result,
        201
      );
    } catch (error) {
      console.error('Withdraw principal error:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Get all investment plans
   * GET /api/investments/plans
   */
  async getInvestmentPlans(req, res) {
    try {
      const plans = await investmentService.getInvestmentPlans();

      return successResponse(
        res,
        'Investment plans retrieved successfully',
        plans
      );
    } catch (error) {
      console.error('Get investment plans error:', error);
      return errorResponse(res, error.message, 400);
    }
  }
}

export default new InvestmentController();
