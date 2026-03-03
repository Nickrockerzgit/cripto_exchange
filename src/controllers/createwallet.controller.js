import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const createWallet = async (req, res) => {
  try {

    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id required"
      });
    }

    // 1️⃣ Check user exists
    const user = await prisma.user.findUnique({
      where: { id: user_id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // 2️⃣ Check wallet already exists
    const existingWallet = await prisma.wallet.findUnique({
      where: { user_id }
    });

    if (existingWallet) {
      return res.json({
        success: true,
        message: "Wallet already exists",
        wallet: existingWallet
      });
    }

    // 3️⃣ Create wallet
    const wallet = await prisma.wallet.create({
      data: {
        user_id,
        main_balance: 0,
        investment_balance: 0,
        profit_balance: 0,
        referral_balance: 0
      }
    });

    return res.json({
      success: true,
      message: "Wallet created successfully",
      wallet
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};