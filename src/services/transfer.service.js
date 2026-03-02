// src/services/transfer.service.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

class TransferService {
  /**
   * Execute user-to-user wallet transfer
   * @param {string} senderId - ID of the sender
   * @param {string} receiverIdentifier - Email, phone, or user ID of receiver
   * @param {number} amount - Amount to transfer
   * @param {string} description - Optional description
   * @returns {Promise<Object>} Transfer result
   */
  async executeTransfer(senderId, receiverIdentifier, amount, description = null) {
    // Validate amount
    if (!amount || amount <= 0) {
      throw new Error('Transfer amount must be greater than 0');
    }

    // Convert amount to number
    const transferAmount = Number(amount);

    try {
      // Find receiver by email, phone, or ID
      const receiver = await prisma.user.findFirst({
        where: {
          OR: [
            { id: receiverIdentifier },
            { email: receiverIdentifier },
            { phone: receiverIdentifier },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
        },
      });

      if (!receiver) {
        throw new Error('Receiver not found');
      }

      // Check if receiver is active
      if (receiver.status !== 'ACTIVE') {
        throw new Error('Receiver account is not active');
      }

      // Check if trying to transfer to self
      if (receiver.id === senderId) {
        throw new Error('Cannot transfer to yourself');
      }

      // Execute transfer in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Get sender wallet with lock
        const senderWallet = await tx.wallet.findUnique({
          where: { user_id: senderId },
        });

        if (!senderWallet) {
          throw new Error('Sender wallet not found');
        }

        // Check sufficient balance
        const senderBalance = Number(senderWallet.main_balance);
        if (senderBalance < transferAmount) {
          throw new Error(`Insufficient balance. Available: ${senderBalance}, Required: ${transferAmount}`);
        }

        // Get receiver wallet
        const receiverWallet = await tx.wallet.findUnique({
          where: { user_id: receiver.id },
        });

        if (!receiverWallet) {
          throw new Error('Receiver wallet not found');
        }

        // Deduct from sender
        const updatedSenderWallet = await tx.wallet.update({
          where: { user_id: senderId },
          data: {
            main_balance: {
              decrement: transferAmount,
            },
          },
        });

        // Add to receiver
        const updatedReceiverWallet = await tx.wallet.update({
          where: { user_id: receiver.id },
          data: {
            main_balance: {
              increment: transferAmount,
            },
          },
        });

        // Create transfer record
        const transfer = await tx.internalTransfer.create({
          data: {
            sender_id: senderId,
            receiver_id: receiver.id,
            amount: transferAmount,
            status: 'SUCCESS',
            description: description,
          },
        });

        // Create transaction records for both parties
        // Sender transaction (debit)
        await tx.transaction.create({
          data: {
            user_id: senderId,
            type: 'USER_TO_USER_TRANSFER_SENT',
            source_wallet: 'MAIN_WALLET',
            destination_wallet: 'USER_WALLET',
            gross_amount: transferAmount,
            fee_amount: 0,
            penalty_amount: 0,
            net_amount: transferAmount,
            status: 'SUCCESS',
            reference_id: transfer.id,
            description: `Transfer sent to ${receiver.name || receiver.email}${description ? ': ' + description : ''}`,
          },
        });

        // Receiver transaction (credit)
        await tx.transaction.create({
          data: {
            user_id: receiver.id,
            type: 'USER_TO_USER_TRANSFER_RECEIVED',
            source_wallet: 'USER_WALLET',
            destination_wallet: 'MAIN_WALLET',
            gross_amount: transferAmount,
            fee_amount: 0,
            penalty_amount: 0,
            net_amount: transferAmount,
            status: 'SUCCESS',
            reference_id: transfer.id,
            description: `Transfer received from user${description ? ': ' + description : ''}`,
          },
        });

        return {
          transfer,
          senderBalance: Number(updatedSenderWallet.main_balance),
          receiverBalance: Number(updatedReceiverWallet.main_balance),
          receiver: {
            id: receiver.id,
            name: receiver.name,
            email: receiver.email,
          },
        };
      });

      return result;
    } catch (error) {
      console.error('Transfer Service Error:', error);
      throw error;
    }
  }

  /**
   * Get user's transfer history
   * @param {string} userId - User ID
   * @param {Object} options - Pagination and filter options
   * @returns {Promise<Object>} Transfer history
   */
  async getTransferHistory(userId, options = {}) {
    const {
      page = 1,
      limit = 10,
      type = 'all', // 'sent', 'received', 'all'
    } = options;

    const skip = (page - 1) * limit;

    try {
      let where = {};

      if (type === 'sent') {
        where.sender_id = userId;
      } else if (type === 'received') {
        where.receiver_id = userId;
      } else {
        where.OR = [
          { sender_id: userId },
          { receiver_id: userId },
        ];
      }

      const [transfers, total] = await Promise.all([
        prisma.internalTransfer.findMany({
          where,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            receiver: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            created_at: 'desc',
          },
          skip,
          take: limit,
        }),
        prisma.internalTransfer.count({ where }),
      ]);

      // Format transfers
      const formattedTransfers = transfers.map((transfer) => ({
        id: transfer.id,
        amount: Number(transfer.amount),
        status: transfer.status,
        description: transfer.description,
        type: transfer.sender_id === userId ? 'SENT' : 'RECEIVED',
        sender: transfer.sender,
        receiver: transfer.receiver,
        created_at: transfer.created_at,
      }));

      return {
        data: formattedTransfers,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Get Transfer History Error:', error);
      throw error;
    }
  }

  /**
   * Get transfer details by ID
   * @param {string} transferId - Transfer ID
   * @param {string} userId - User ID (for authorization check)
   * @returns {Promise<Object>} Transfer details
   */
  async getTransferById(transferId, userId) {
    try {
      const transfer = await prisma.internalTransfer.findUnique({
        where: { id: transferId },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!transfer) {
        throw new Error('Transfer not found');
      }

      // Check if user is authorized to view this transfer
      if (transfer.sender_id !== userId && transfer.receiver_id !== userId) {
        throw new Error('Unauthorized to view this transfer');
      }

      return {
        id: transfer.id,
        amount: Number(transfer.amount),
        status: transfer.status,
        description: transfer.description,
        type: transfer.sender_id === userId ? 'SENT' : 'RECEIVED',
        sender: transfer.sender,
        receiver: transfer.receiver,
        created_at: transfer.created_at,
      };
    } catch (error) {
      console.error('Get Transfer By ID Error:', error);
      throw error;
    }
  }

  /**
   * Search for receiver by email or phone
   * @param {string} identifier - Email or phone number
   * @returns {Promise<Object>} User details
   */
  async searchReceiver(identifier) {
    try {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: identifier },
            { phone: identifier },
          ],
          status: 'ACTIVE',
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      });

      if (!user) {
        return null;
      }

      return user;
    } catch (error) {
      console.error('Search Receiver Error:', error);
      throw error;
    }
  }
}

export default new TransferService();
