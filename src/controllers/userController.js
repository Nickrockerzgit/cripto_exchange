import * as userService from '../services/user.service.js';
import { successResponse } from '../utils/successResponse.js';
import { errorResponse } from '../utils/errorResponse.js';
import { PrismaClient } from '@prisma/client';
// 🔹 Create User
export const createUser = async (req, res) => {
  try {
    if (!req.body.email || !req.body.password_hash) {
      return errorResponse(res, "Required fields missing", 400);
    }

    const user = await userService.createUser(req.body);

    return successResponse(res, "User created successfully", user, 201);

  } catch (error) {
    console.error("Create User Error:", error);
    return errorResponse(res, "Failed to create user");
  }
};

// 🔹 Get All Users
export const getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    return successResponse(res, "Users fetched successfully", users);
  } catch (error) {
    console.error("Get All Users Error:", error);
    return errorResponse(res, "Failed to fetch users");
  }
};


// 🔹 Get Single User
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) return errorResponse(res, "User ID required", 400);

    const user = await userService.getUserById(id);

    if (!user) return errorResponse(res, "User not found", 404);

    return successResponse(res, "User fetched successfully", user);

  } catch (error) {
    console.error("Get User Error:", error);
    return errorResponse(res, "Failed to fetch user");
  }
};

export const getUserByRefralCode = async (req, res) => {
  try {
    const { referral_code } = req.params;
    if (!referral_code) return errorResponse(res, "Referral code required", 400);

    const user = await userService.getUserByRefralCode(referral_code);
    if (!user) return successResponse(res, "No user found with this referral code", 404);
    return successResponse(res, "User fetched successfully", user);
  } catch (error) {
    console.error("Get User by Referral Code Error:", error);
    return errorResponse(res, "Failed to fetch user");
  }
}

// 🔹 Update User
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) return errorResponse(res, "User ID required", 400);

    const user = await userService.updateUser(id, req.body);

    return successResponse(res, "User updated successfully", user);

  } catch (error) {
    console.error("Update User Error:", error);

    if (error.code === 'P2025') {
      return errorResponse(res, "User not found", 404);
    }

    return errorResponse(res, "Failed to update user");
  }
};


// 🔹 Delete User
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) return errorResponse(res, "User ID required", 400);

    await userService.deleteUser(id);

    return successResponse(res, "User deleted successfully");

  } catch (error) {
    console.error("Delete User Error:", error);

    if (error.code === 'P2025') {
      return errorResponse(res, "User not found", 404);
    }

    return errorResponse(res, "Failed to delete user");
  }
};

function calculateGrowth(current, previous) {
  if (!previous || previous === 0) {
    return {
      increase: current,
      percentage: 0,
      positive: true,
    };
  }

  const diff = current - previous;
  const percentage = (diff / previous) * 100;

  return {
    increase: diff,
    percentage: Math.abs(Number(percentage.toFixed(2))),
    positive: diff >= 0,
  };
}

const prisma = new PrismaClient();

async function getWalletBalance(req, res) {
  try {
    const userId = req.user.userId;

    const wallet = await prisma.wallet.findUnique({
      where: { user_id: userId },
    });

    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    // 🔥 Calculate growth for each field
    const main = calculateGrowth(
      Number(wallet.main_balance),
      Number(wallet.previous_main_balance)
    );

    const active = calculateGrowth(
      Number(wallet.active_deposit),
      Number(wallet.previous_active_deposit)
    );

    const profit = calculateGrowth(
      Number(wallet.profit_balance),
      Number(wallet.previous_profit_balance)
    );

    const referral = calculateGrowth(
      Number(wallet.referral_balance),
      Number(wallet.previous_referral_balance)
    );

    const investment = calculateGrowth(
      Number(wallet.investment_balance),
      Number(wallet.previous_investment_balance)
    );

    return res.json({
      mainWallet: Number(wallet.main_balance),
      inscrease_mainWallet: main.increase,
      inscrease_percentage_mainWallet_possitive: main.positive,

      activeDeposit: Number(wallet.active_deposit),
      inscrease_percentage_activeDeposit: active.percentage,
      increase_activeDeposit_positive: active.positive,

      profitBalance: Number(wallet.profit_balance),
      inscrease_percentage_profitBalance: profit.percentage,
      inscrease_profitBalance_positive: profit.positive,

      referralBonus: Number(wallet.referral_balance),
      inscrease_percentage_referralBonus: referral.percentage,
      inscrease_referralBonus_positive: referral.positive,

      totalInvestment: Number(wallet.investment_balance),
      inscrease_percentage_totalInvestment: investment.percentage,
      inscrease_percentage_totalInvestment_positive: investment.positive,
    });

  } catch (error) {
    console.error("Wallet error:", error);
    return res.status(500).json({ error: "Server error" });
  }
}

export async function getTransactionHistory(req, res) {
  try {
    const userId = req.user.userId;

    // Query params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const type = req.query.type;      // optional filter
    const status = req.query.status;  // optional filter

    const skip = (page - 1) * limit;

    // Build dynamic filter
    const where = {
      user_id: userId,
      ...(type && { type }),
      ...(status && { status }),
    };

    // Fetch transactions
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: {
          created_at: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    // Map to DTO
    const formattedTransactions = transactions.map((txn) => ({
      id: txn.id,
      type: txn.type,
      amount: Number(txn.gross_amount || 0),
      fee: Number(txn.fee_amount || 0),
      penalty: Number(txn.penalty_amount || 0),
      netAmount: Number(txn.net_amount || 0),
      status: txn.status,
      referenceId: txn.reference_id,
      sourceWallet: txn.source_wallet,
      destinationWallet: txn.destination_wallet,
      description: txn.description,
      timestamp: txn.created_at,
    }));

    return res.json({
      data: formattedTransactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error("Transaction history error:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
export  {getWalletBalance};