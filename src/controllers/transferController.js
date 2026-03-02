// src/controllers/transferController.js
import transferService from '../services/transfer.service.js';
import { successResponse } from '../utils/successResponse.js';
import { errorResponse } from '../utils/errorResponse.js';

class TransferController {
  /**
   * Execute user-to-user transfer
   * POST /api/transfers
   * Body: { receiver: string, amount: number, description?: string }
   */
  async executeTransfer(req, res) {
    try {
      const senderId = req.user.userId;
      const { receiver, amount, description } = req.body;

      // Validation
      if (!receiver) {
        return errorResponse(res, 'Receiver email, phone, or ID is required', 400);
      }

      if (!amount || amount <= 0) {
        return errorResponse(res, 'Valid amount is required', 400);
      }

      // Execute transfer
      const result = await transferService.executeTransfer(
        senderId,
        receiver,
        amount,
        description
      );

      return successResponse(
        res,
        'Transfer completed successfully',
        {
          transferId: result.transfer.id,
          amount: Number(result.transfer.amount),
          receiver: result.receiver,
          newBalance: result.senderBalance,
          timestamp: result.transfer.created_at,
        },
        201
      );
    } catch (error) {
      console.error('Execute Transfer Error:', error);

      // Handle specific errors
      if (error.message.includes('not found')) {
        return errorResponse(res, error.message, 404);
      }
      if (error.message.includes('Insufficient balance')) {
        return errorResponse(res, error.message, 400);
      }
      if (error.message.includes('not active')) {
        return errorResponse(res, error.message, 400);
      }
      if (error.message.includes('Cannot transfer to yourself')) {
        return errorResponse(res, error.message, 400);
      }

      return errorResponse(res, 'Transfer failed: ' + error.message, 500);
    }
  }

  /**
   * Get transfer history
   * GET /api/transfers/history
   * Query params: page, limit, type (sent/received/all)
   */
  async getTransferHistory(req, res) {
    try {
      const userId = req.user.userId;
      const { page, limit, type } = req.query;

      const options = {
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 10,
        type: type || 'all',
      };

      const result = await transferService.getTransferHistory(userId, options);

      return successResponse(res, 'Transfer history fetched successfully', result);
    } catch (error) {
      console.error('Get Transfer History Error:', error);
      return errorResponse(res, 'Failed to fetch transfer history', 500);
    }
  }

  /**
   * Get transfer details by ID
   * GET /api/transfers/:id
   */
  async getTransferById(req, res) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      if (!id) {
        return errorResponse(res, 'Transfer ID is required', 400);
      }

      const transfer = await transferService.getTransferById(id, userId);

      return successResponse(res, 'Transfer details fetched successfully', transfer);
    } catch (error) {
      console.error('Get Transfer By ID Error:', error);

      if (error.message.includes('not found')) {
        return errorResponse(res, error.message, 404);
      }
      if (error.message.includes('Unauthorized')) {
        return errorResponse(res, error.message, 403);
      }

      return errorResponse(res, 'Failed to fetch transfer details', 500);
    }
  }

  /**
   * Search for receiver
   * POST /api/transfers/search-receiver
   * Body: { identifier: string }
   */
  async searchReceiver(req, res) {
    try {
      const { identifier } = req.body;

      if (!identifier) {
        return errorResponse(res, 'Email or phone number is required', 400);
      }

      const receiver = await transferService.searchReceiver(identifier);

      if (!receiver) {
        return errorResponse(res, 'User not found or inactive', 404);
      }

      return successResponse(res, 'User found', receiver);
    } catch (error) {
      console.error('Search Receiver Error:', error);
      return errorResponse(res, 'Failed to search user', 500);
    }
  }

  /**
   * Get transfer statistics for user
   * GET /api/transfers/stats
   */
  async getTransferStats(req, res) {
    try {
      const userId = req.user.userId;

      const [sentTransfers, receivedTransfers] = await Promise.all([
        transferService.getTransferHistory(userId, { type: 'sent', limit: 1000 }),
        transferService.getTransferHistory(userId, { type: 'received', limit: 1000 }),
      ]);

      const totalSent = sentTransfers.data.reduce(
        (sum, t) => sum + Number(t.amount),
        0
      );
      const totalReceived = receivedTransfers.data.reduce(
        (sum, t) => sum + Number(t.amount),
        0
      );

      const stats = {
        totalSent: totalSent,
        totalReceived: totalReceived,
        totalSentCount: sentTransfers.pagination.total,
        totalReceivedCount: receivedTransfers.pagination.total,
        netTransfer: totalReceived - totalSent,
      };

      return successResponse(res, 'Transfer statistics fetched successfully', stats);
    } catch (error) {
      console.error('Get Transfer Stats Error:', error);
      return errorResponse(res, 'Failed to fetch transfer statistics', 500);
    }
  }
}

export default new TransferController();
