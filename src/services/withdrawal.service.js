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
   * Request withdrawal (Profit or Principal)
   */
  async requestWithdrawal(userId, type, requestedAmount) {
    try {
      // Validate withdrawal window (1st-5th of month)
      const today = new Date();
      const dayOfMonth = today.getDate();

      if (dayOfMonth < 1 || dayOfMonth > 5) {
        throw new Error('Withdrawals are only allowed between 1st-5th of each month');
      }

      // Validate amount
      const amount = parseFloat(requestedAmount);
      if (amount < 100) {
        throw new Error('Minimum withdrawal amount is $100');
      }

      // Get user wallet
      const wallet = await prisma.wallet.findUnique({
        where: { user_id: userId }
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      let platformFee = 0;
      let penaltyFee = 0;
      let netAmount = 0;
      let sourceBalance = '';

      if (type === 'PROFIT') {
        // Check if user has sufficient profit balance
        if (parseFloat(wallet.profit_balance) < amount) {
          throw new Error('Insufficient profit balance');
        }

        // Calculate fee: 1% platform fee
        platformFee = amount * 0.01;
        netAmount = amount - platformFee;
        sourceBalance = 'PROFIT_BALANCE';

        // Create withdrawal in transaction
        const withdrawal = await prisma.$transaction(async (tx) => {
          // Deduct from profit balance
          await tx.wallet.update({
            where: { user_id: userId },
            data: {
              profit_balance: {
                decrement: amount
              }
            }
          });

          // Create withdrawal record
          const newWithdrawal = await tx.withdrawal.create({
            data: {
              user_id: userId,
              type: type,
              requested_amount: amount,
              platform_fee: platformFee,
              penalty_fee: 0,
              net_amount: netAmount,
              status: 'PENDING',
              ticket_raised_date: new Date()
            }
          });

          // Create transaction record
          await tx.transaction.create({
            data: {
              user_id: userId,
              type: 'PROFIT_WITHDRAWAL',
              source_wallet: sourceBalance,
              destination_wallet: 'EXTERNAL',
              gross_amount: amount,
              fee_amount: platformFee,
              penalty_amount: 0,
              net_amount: netAmount,
              status: 'PENDING',
              reference_id: newWithdrawal.id,
              description: `Profit withdrawal request - $${netAmount} (Fee: $${platformFee})`
            }
          });

          return newWithdrawal;
        });

        return withdrawal;

      } else if (type === 'PRINCIPAL') {
        // For principal withdrawal, we need to deduct from investments (FIFO)
        const activeInvestments = await prisma.investment.findMany({
          where: {
            user_id: userId,
            status: 'ACTIVE',
            remaining_principal: {
              gt: 0
            }
          },
          orderBy: {
            start_date: 'asc' // FIFO - First In First Out
          }
        });

        // Calculate total available principal
        const totalPrincipal = activeInvestments.reduce(
          (sum, inv) => sum + parseFloat(inv.remaining_principal),
          0
        );

        if (totalPrincipal < amount) {
          throw new Error('Insufficient principal balance');
        }

        // Calculate fees: 1% platform fee + possible 15% early exit fee
        platformFee = amount * 0.01;

        // Check if any investment is less than 6 months old
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const hasEarlyInvestment = activeInvestments.some(
          inv => new Date(inv.start_date) > sixMonthsAgo
        );

        if (hasEarlyInvestment) {
          penaltyFee = amount * 0.15;
        }

        netAmount = amount - platformFee - penaltyFee;
        sourceBalance = 'INVESTMENT';

        // Create withdrawal in transaction
        const withdrawal = await prisma.$transaction(async (tx) => {
          // Deduct from investments (FIFO)
          let remainingToDeduct = amount;

          for (const investment of activeInvestments) {
            if (remainingToDeduct <= 0) break;

            const invPrincipal = parseFloat(investment.remaining_principal);
            const deductAmount = Math.min(invPrincipal, remainingToDeduct);

            await tx.investment.update({
              where: { id: investment.id },
              data: {
                remaining_principal: {
                  decrement: deductAmount
                },
                status: deductAmount === invPrincipal ? 'COMPLETED' : 'ACTIVE'
              }
            });

            remainingToDeduct -= deductAmount;
          }

          // Create withdrawal record
          const newWithdrawal = await tx.withdrawal.create({
            data: {
              user_id: userId,
              type: type,
              requested_amount: amount,
              platform_fee: platformFee,
              penalty_fee: penaltyFee,
              net_amount: netAmount,
              status: 'PENDING',
              ticket_raised_date: new Date()
            }
          });

          // Create transaction record
          await tx.transaction.create({
            data: {
              user_id: userId,
              type: 'PRINCIPAL_WITHDRAWAL',
              source_wallet: sourceBalance,
              destination_wallet: 'EXTERNAL',
              gross_amount: amount,
              fee_amount: platformFee,
              penalty_amount: penaltyFee,
              net_amount: netAmount,
              status: 'PENDING',
              reference_id: newWithdrawal.id,
              description: `Principal withdrawal request - $${netAmount} (Fee: $${platformFee}${penaltyFee > 0 ? `, Early exit penalty: $${penaltyFee}` : ''})`
            }
          });

          return newWithdrawal;
        });

        return withdrawal;

      } else {
        throw new Error('Invalid withdrawal type. Must be PROFIT or PRINCIPAL');
      }

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
