import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

class WithdrawalService {

  async getUserWithdrawals(userId, type = null, status = null) {
    try {
      const where = { user_id: userId };
      if (type) where.type = type;
      if (status) where.status = status;

      const withdrawals = await prisma.withdrawal.findMany({
        where,
        orderBy: { created_at: 'desc' }
      });

      return withdrawals;
    } catch (error) {
      throw error;
    }
  }

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

  async getWithdrawalStats(userId) {
    try {
      const stats = await prisma.withdrawal.groupBy({
        by: ['type', 'status'],
        where: { user_id: userId },
        _sum: {
          requested_amount: true,
          net_amount: true
        },
        _count: { id: true }
      });

      return stats;
    } catch (error) {
      throw error;
    }
  }

  async requestWithdrawal(userId, type, requestedAmount, walletAddress) {
    try {
      const amount = parseFloat(requestedAmount);
      if (amount <= 0) {
        throw new Error('Withdrawal amount must be greater than zero');
      }
    
      if (!walletAddress || walletAddress.trim() === '') {
        throw new Error('Wallet address is required');
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true }
      });
      if (!user) throw new Error('User not found');

      const wallet = await prisma.wallet.findUnique({
        where: { user_id: userId }
      });
      if (!wallet) throw new Error('Wallet not found');

      const today = new Date();
      const dayOfMonth = today.getDate();

      let netAmount = 0;
      let penaltyFee = 0;
      let sourceBalance = '';

      if (type === 'PROFIT') {
        // ═══════════════════════════════════════════
        // PROFIT WITHDRAWAL
        // ═══════════════════════════════════════════

        // if (dayOfMonth < 1 || dayOfMonth > 5) {
        //   throw new Error('Profit withdrawal is only allowed between 1st-5th of every month');
        // }

        const profitBalance = parseFloat(wallet.profit_balance);
        const referralBalance = parseFloat(wallet.referral_balance);
        const totalProfit = parseFloat(wallet.total_profit);

        if (totalProfit < amount) {
          throw new Error(
            `Insufficient total profit balance. Available: $${totalProfit.toFixed(2)}, Requested: $${amount.toFixed(2)}`
          );
        }

        netAmount = amount;
        sourceBalance = 'TOTAL_PROFIT';

        // Calculate deductions before transaction
        let deductFromProfit = 0;
        let deductFromReferral = 0;

        if (profitBalance >= amount) {
          deductFromProfit = amount;
          deductFromReferral = 0;
        } else {
          deductFromProfit = profitBalance;
          deductFromReferral = amount - profitBalance;
        }

        const withdrawal = await prisma.$transaction(async (tx) => {
          await tx.wallet.update({
            where: { user_id: userId },
            data: {
              profit_balance: { decrement: deductFromProfit },
              referral_balance: { decrement: deductFromReferral },
              total_profit: { decrement: amount }
            }
          });

          const newWithdrawal = await tx.withdrawal.create({
            data: {
              user_id: userId,
              user_address: walletAddress,
              type: type,
              requested_amount: amount,
              platform_fee: 0,
              penalty_fee: 0,
              net_amount: netAmount,
              status: 'PENDING',
              ticket_raised_date: new Date()
            }
          });

          await tx.transaction.create({
            data: {
              user_id: userId,
              type: 'PROFIT_WITHDRAWAL',
              source_wallet: sourceBalance,
              destination_wallet: walletAddress,
              gross_amount: amount,
              fee_amount: 0,
              penalty_amount: 0,
              net_amount: netAmount,
              status: 'PENDING',
              reference_id: newWithdrawal.id,
              description: `Profit withdrawal - From profit: $${deductFromProfit.toFixed(2)}, From referral: $${deductFromReferral.toFixed(2)}, Total: $${netAmount.toFixed(2)}`
            }
          });

          return newWithdrawal;
        }, {
          timeout: 30000 // ← 30 seconds timeout
        });

        return {
          withdrawal,
          userData: {
            name: user.name,
            withdrawalType: type,
            walletAddress,
            requestedAmount: amount,
            finalAmount: netAmount
          }
        };

      } else if (type === 'PRINCIPAL') {
        // ═══════════════════════════════════════════
        // PRINCIPAL WITHDRAWAL
        // ═══════════════════════════════════════════

           if (amount < 100) {
        throw new Error('Minimum withdrawal amount is $100');
      }

        // if (dayOfMonth !== 28) {
        //   throw new Error('Principal withdrawal is only allowed on the 28th of every month');
        // }

        const mainBalance = parseFloat(wallet.main_balance);
        if (mainBalance < amount) {
          throw new Error(
            `Insufficient principal balance. Available: $${mainBalance.toFixed(2)}, Requested: $${amount.toFixed(2)}`
          );
        }

        penaltyFee = amount * 0.25;
        netAmount = amount - penaltyFee;
        sourceBalance = 'MAIN_BALANCE';

        const withdrawal = await prisma.$transaction(async (tx) => {
          await tx.wallet.update({
            where: { user_id: userId },
            data: {
              main_balance: { decrement: amount }
            }
          });

          const newWithdrawal = await tx.withdrawal.create({
            data: {
              user_id: userId,
              user_address: walletAddress,
              type: type,
              requested_amount: amount,
              platform_fee: 0,
              penalty_fee: penaltyFee,
              net_amount: netAmount,
              status: 'PENDING',
              ticket_raised_date: new Date()
            }
          });

          await tx.transaction.create({
            data: {
              user_id: userId,
              type: 'PRINCIPAL_WITHDRAWAL',
              source_wallet: sourceBalance,
              destination_wallet: walletAddress,
              gross_amount: amount,
              fee_amount: 0,
              penalty_amount: penaltyFee,
              net_amount: netAmount,
              status: 'PENDING',
              reference_id: newWithdrawal.id,
              description: `Principal withdrawal - Requested: $${amount.toFixed(2)}, Penalty (25%): $${penaltyFee.toFixed(2)}, Admin receives: $${netAmount.toFixed(2)}`
            }
          });

          return newWithdrawal;
        }, {
          timeout: 30000 // ← 30 seconds timeout
        });

        return {
          withdrawal,
          userData: {
            name: user.name,
            withdrawalType: type,
            walletAddress,
            requestedAmount: amount,
            penaltyAmount: penaltyFee,
            finalAmount: netAmount
          }
        };

      } else {
        throw new Error('Invalid withdrawal type. Must be PROFIT or PRINCIPAL');
      }

    } catch (error) {
      throw error;
    }
  }

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
        if (withdrawal.type === 'PROFIT') {
          await tx.wallet.update({
            where: { user_id: userId },
            data: {
              profit_balance: { increment: withdrawal.requested_amount },
              total_profit: { increment: withdrawal.requested_amount }
            }
          });
        } else if (withdrawal.type === 'PRINCIPAL') {
          await tx.wallet.update({
            where: { user_id: userId },
            data: {
              main_balance: { increment: withdrawal.requested_amount }
            }
          });
        }

        const updated = await tx.withdrawal.update({
          where: { id: withdrawalId },
          data: { status: 'CANCELLED' }
        });

        await tx.transaction.updateMany({
          where: { reference_id: withdrawalId },
          data: { status: 'CANCELLED' }
        });

        return updated;
      }, {
        timeout: 30000 // ← 30 seconds timeout
      });

      return cancelled;
    } catch (error) {
      throw error;
    }
  }

  async approveWithdrawal(withdrawalId, adminId) {
    try {
      const withdrawal = await prisma.withdrawal.findUnique({
        where: { id: withdrawalId }
      });

      if (!withdrawal) throw new Error('Withdrawal not found');
      if (withdrawal.status !== 'PENDING') {
        throw new Error('Only pending withdrawals can be approved');
      }

      const approved = await prisma.$transaction(async (tx) => {
        const updated = await tx.withdrawal.update({
          where: { id: withdrawalId },
          data: {
            status: 'COMPLETED',
            processed_at: new Date()
          }
        });

        await tx.transaction.updateMany({
          where: { reference_id: withdrawalId },
          data: {
            status: 'COMPLETED',
            description: {
              set: `Approved - ${withdrawal.type} withdrawal completed`
            }
          }
        });

        return updated;
      }, {
        timeout: 30000 // ← 30 seconds timeout
      });

      return approved;
    } catch (error) {
      throw error;
    }
  }

  async rejectWithdrawal(withdrawalId, adminId, reason = null) {
    try {
      const withdrawal = await prisma.withdrawal.findUnique({
        where: { id: withdrawalId }
      });

      if (!withdrawal) throw new Error('Withdrawal not found');
      if (withdrawal.status !== 'PENDING') {
        throw new Error('Only pending withdrawals can be rejected');
      }

      const rejected = await prisma.$transaction(async (tx) => {
        if (withdrawal.type === 'PROFIT') {
          await tx.wallet.update({
            where: { user_id: withdrawal.user_id },
            data: {
              profit_balance: { increment: withdrawal.requested_amount },
              total_profit: { increment: withdrawal.requested_amount }
            }
          });
        } else if (withdrawal.type === 'PRINCIPAL') {
          await tx.wallet.update({
            where: { user_id: withdrawal.user_id },
            data: {
              main_balance: { increment: withdrawal.requested_amount }
            }
          });
        }

        const updated = await tx.withdrawal.update({
          where: { id: withdrawalId },
          data: { status: 'REJECTED' }
        });

        await tx.transaction.updateMany({
          where: { reference_id: withdrawalId },
          data: {
            status: 'REJECTED',
            description: {
              set: `Rejected${reason ? ` - Reason: ${reason}` : ''}`
            }
          }
        });

        return updated;
      }, {
        timeout: 30000 // ← 30 seconds timeout
      });

      return rejected;
    } catch (error) {
      throw error;
    }
  }

  async getPendingWithdrawals() {
    try {
      const withdrawals = await prisma.withdrawal.findMany({
        where: { status: 'PENDING' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { created_at: 'asc' }
      });

      return withdrawals.map(w => ({
        id: w.id,
        userName: w.user.name,
        userEmail: w.user.email,
        withdrawalType: w.type,
        userWalletAddress: w.user_address,
        requestedAmount: parseFloat(w.requested_amount),
        penaltyFee: parseFloat(w.penalty_fee || 0),
        finalAmount: parseFloat(w.net_amount),
        requestedDate: w.ticket_raised_date,
        status: w.status
      }));
    } catch (error) {
      throw error;
    }
  }
}

export default new WithdrawalService();