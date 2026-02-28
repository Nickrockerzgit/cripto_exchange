import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

class WithdrawalService {
  /**
   * Get user withdrawals
   */
  async getUserWithdrawals(userId, type = null, status = null) {
    try {
      const where = { user_id: userId };

      if (type) {
        where.type = type;
      }

      if (status) {
        where.status = status;
      }

      const withdrawals = await prisma.withdrawal.findMany({
        where,
        orderBy: {
          created_at: 'desc'
        }
      });

      return withdrawals;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get single withdrawal details
   */
  async getWithdrawalById(withdrawalId, userId) {
    try {
      const withdrawal = await prisma.withdrawal.findFirst({
        where: {
          id: withdrawalId,
          user_id: userId
        }
      });

      if (!withdrawal) {
        throw new Error('Withdrawal not found');
      }

      return withdrawal;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Process pending principal withdrawals (Admin function)
   * Should be run between 1st-5th of each month
   */
  async processPrincipalWithdrawals() {
    try {
      const today = new Date();
      const dayOfMonth = today.getDate();

      // Check if today is between 1st and 5th
      if (dayOfMonth < 1 || dayOfMonth > 5) {
        throw new Error('Principal withdrawals can only be processed between 1st-5th of the month');
      }

      // Get all pending principal withdrawals from previous month
      const pendingWithdrawals = await prisma.withdrawal.findMany({
        where: {
          type: 'PRINCIPAL',
          status: 'PENDING'
        }
      });

      console.log(`Processing ${pendingWithdrawals.length} principal withdrawals`);

      const results = [];

      for (const withdrawal of pendingWithdrawals) {
        try {
          await prisma.$transaction(async (tx) => {
            // Add to main balance
            await tx.wallet.update({
              where: { user_id: withdrawal.user_id },
              data: {
                main_balance: {
                  increment: withdrawal.net_amount
                }
              }
            });

            // Update withdrawal status
            await tx.withdrawal.update({
              where: { id: withdrawal.id },
              data: {
                status: 'COMPLETED',
                processed_at: new Date()
              }
            });

            // Update transaction record
            await tx.transaction.updateMany({
              where: {
                reference_id: withdrawal.id,
                type: 'PRINCIPAL_WITHDRAWAL'
              },
              data: {
                status: 'COMPLETED'
              }
            });
          });

          results.push({
            withdrawalId: withdrawal.id,
            userId: withdrawal.user_id,
            amount: withdrawal.net_amount,
            success: true
          });
        } catch (error) {
          console.error(`Error processing withdrawal ${withdrawal.id}:`, error.message);
          results.push({
            withdrawalId: withdrawal.id,
            userId: withdrawal.user_id,
            error: error.message,
            success: false
          });
        }
      }

      return results;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get withdrawal statistics
   */
  async getWithdrawalStats(userId) {
    try {
      const stats = await prisma.withdrawal.groupBy({
        by: ['type', 'status'],
        where: {
          user_id: userId
        },
        _sum: {
          requested_amount: true,
          net_amount: true
        },
        _count: {
          id: true
        }
      });

      return stats;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cancel pending withdrawal (user can cancel before processing)
   */
  async cancelWithdrawal(withdrawalId, userId) {
    try {
      const withdrawal = await prisma.withdrawal.findFirst({
        where: {
          id: withdrawalId,
          user_id: userId,
          status: 'PENDING'
        }
      });

      if (!withdrawal) {
        throw new Error('Withdrawal not found or cannot be cancelled');
      }

      const cancelled = await prisma.$transaction(async (tx) => {
        // Return amount to respective balance
        if (withdrawal.type === 'PROFIT') {
          await tx.wallet.update({
            where: { user_id: userId },
            data: {
              profit_balance: {
                increment: withdrawal.requested_amount
              }
            }
          });
        } else if (withdrawal.type === 'PRINCIPAL') {
          // For principal, we need to add back to investments (FIFO reverse)
          // This is complex, for now just reject cancellation
          throw new Error('Principal withdrawal cannot be cancelled after submission');
        }

        // Update withdrawal status
        const updated = await tx.withdrawal.update({
          where: { id: withdrawalId },
          data: {
            status: 'CANCELLED'
          }
        });

        // Update transaction
        await tx.transaction.updateMany({
          where: {
            reference_id: withdrawalId
          },
          data: {
            status: 'CANCELLED'
          }
        });

        return updated;
      });

      return cancelled;
    } catch (error) {
      throw error;
    }
  }
}

export default new WithdrawalService();
