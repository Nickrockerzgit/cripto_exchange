import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

class AdminDashboardService {

  async getDashboardStats() {

    // total users
    const totalUsers = await prisma.user.count();

    // total wallet balance from wallet table
    const walletSum = await prisma.wallet.aggregate({
      _sum: {
        main_balance: true
      }
    });

    // total withdrawals
    const withdrawalSum = await prisma.withdrawal.aggregate({
      where: {
        status: "COMPLETED"
      },
      _sum: {
        net_amount: true
      }
    });

    // robot activated users
    const robotUsers = await prisma.user.count({
      where: {
        robot_status: "ACTIVE"
      }
    });

    return {
      totalUsers,
      totalDeposits: Number(walletSum._sum.main_balance || 0),
      totalWithdrawals: Number(withdrawalSum._sum.net_amount || 0),
      robotActivatedUsers: robotUsers
    };

  }

}

export default new AdminDashboardService();