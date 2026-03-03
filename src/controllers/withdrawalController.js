import withdrawalService from '../services/withdrawal.service.js';
import { successResponse } from '../utils/successResponse.js';
import { errorResponse } from '../utils/errorResponse.js';

class WithdrawalController {
  /**
   * Get user withdrawals
   * GET /api/withdrawals
   */
  async getUserWithdrawals(req, res) {
    try {
      const userId = req.user.id;
      const { type, status } = req.query;

      const withdrawals = await withdrawalService.getUserWithdrawals(userId, type, status);

      return successResponse(
        res,
        'Withdrawals retrieved successfully',
        withdrawals
      );
    } catch (error) {
      console.error('Get withdrawals error:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Get single withdrawal
   * GET /api/withdrawals/:id
   */
  async getWithdrawalById(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const withdrawal = await withdrawalService.getWithdrawalById(id, userId);

      return successResponse(
        res,
        'Withdrawal retrieved successfully',
        withdrawal
      );
    } catch (error) {
      console.error('Get withdrawal error:', error);
      return errorResponse(res, error.message, 404);
    }
  }

  /**
   * Request withdrawal
   * POST /api/withdrawals/request
   */
  async requestWithdrawal(req, res) {
    try {
      const userId = req.user.id;
      const { type, amount } = req.body;

      // Validate input
      if (!type || !amount) {
        return errorResponse(res, 'Type and amount are required', 400);
      }

      if (!['PROFIT', 'PRINCIPAL'].includes(type.toUpperCase())) {
        return errorResponse(res, 'Invalid withdrawal type', 400);
      }

      const withdrawal = await withdrawalService.requestWithdrawal(
        userId,
        type.toUpperCase(),
        amount
      );

      return successResponse(
        res,
        'Withdrawal request submitted successfully',
        withdrawal,
        201
      );
    } catch (error) {
      console.error('Request withdrawal error:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Get withdrawal statistics
   * GET /api/withdrawals/stats
   */
  async getWithdrawalStats(req, res) {
    try {
      const userId = req.user.id;

      const stats = await withdrawalService.getWithdrawalStats(userId);

      return successResponse(
        res,
        'Withdrawal statistics retrieved successfully',
        stats
      );
    } catch (error) {
      console.error('Get withdrawal stats error:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Cancel pending withdrawal
   * POST /api/withdrawals/:id/cancel
   */
  async cancelWithdrawal(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const cancelled = await withdrawalService.cancelWithdrawal(id, userId);

      return successResponse(
        res,
        'Withdrawal cancelled successfully',
        cancelled
      );
    } catch (error) {
      console.error('Cancel withdrawal error:', error);
      return errorResponse(res, error.message, 400);
    }
  }

  /**
   * Process principal withdrawals (Admin only)
   * POST /api/withdrawals/process-principal
   */
  async processPrincipalWithdrawals(req, res) {
    try {
      // TODO: Add admin role check middleware
      const results = await withdrawalService.processPrincipalWithdrawals();

      return successResponse(
        res,
        'Principal withdrawals processed successfully',
        results
      );
    } catch (error) {
      console.error('Process principal withdrawals error:', error);
      return errorResponse(res, error.message, 400);
    }
  }
}

export default new WithdrawalController();
