import withdrawalService from '../services/withdrawal.service.js';
import { successResponse } from '../utils/successResponse.js';
import { errorResponse } from '../utils/errorResponse.js';

const withdrawalController = {
  /**
   * Get user withdrawals
   * GET /api/withdrawals
   */
  getUserWithdrawals: async (req, res) => {
    try {
      const userId = req.user.userId;
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
  },

  /**
   * Get single withdrawal
   * GET /api/withdrawals/:id
   */
  getWithdrawalById: async (req, res) => {
    try {
      const userId = req.user.userId;
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
  },

  /**
   * Request withdrawal
   * POST /api/withdrawals/request
   * Body: { type: "PROFIT" | "PRINCIPAL", amount: number, walletAddress: string }
   */
  requestWithdrawal: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { type, amount, walletAddress } = req.body;

      const result = await withdrawalService.requestWithdrawal(
        userId,
        type,
        amount,
        walletAddress
      );

      return successResponse(
        res,
        'Withdrawal request submitted successfully',
        result
      );
    } catch (error) {
      console.error('Request withdrawal error:', error);
      return errorResponse(res, error.message, 400);
    }
  },

  /**
   * Get withdrawal statistics
   * GET /api/withdrawals/stats
   */
  getWithdrawalStats: async (req, res) => {
    try {
      const userId = req.user.userId;

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
  },

  /**
   * Cancel pending withdrawal
   * POST /api/withdrawals/:id/cancel
   */
  cancelWithdrawal: async (req, res) => {
    try {
      const userId = req.user.userId;
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
  },

  /**
   * Admin: Get all pending withdrawals
   * GET /api/withdrawals/admin/pending
   */
  getPendingWithdrawals: async (req, res) => {
    try {
      const withdrawals = await withdrawalService.getPendingWithdrawals();

      return successResponse(
        res,
        'Pending withdrawals retrieved successfully',
        withdrawals
      );
    } catch (error) {
      console.error('Get pending withdrawals error:', error);
      return errorResponse(res, error.message, 400);
    }
  },

  /**
   * Admin: Approve withdrawal
   * POST /api/withdrawals/admin/:id/approve
   */
  approveWithdrawal: async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = req.admin?.adminId || req.user?.userId;

      const approved = await withdrawalService.approveWithdrawal(id, adminId);

      return successResponse(
        res,
        'Withdrawal approved successfully',
        approved
      );
    } catch (error) {
      console.error('Approve withdrawal error:', error);
      return errorResponse(res, error.message, 400);
    }
  },

  /**
   * Admin: Reject withdrawal
   * POST /api/withdrawals/admin/:id/reject
   * Body: { reason?: string }
   */
  rejectWithdrawal: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = req.admin?.adminId || req.user?.userId;

      const rejected = await withdrawalService.rejectWithdrawal(id, adminId, reason);

      return successResponse(
        res,
        'Withdrawal rejected successfully',
        rejected
      );
    } catch (error) {
      console.error('Reject withdrawal error:', error);
      return errorResponse(res, error.message, 400);
    }
  }
};

export default withdrawalController;