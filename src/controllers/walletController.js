import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getDepositAddress = async (req, res) => {
  try {
    // const userId = req.user.id;=====================================================================================
    const userId = req.user.userId;

    const address = await prisma.depositAddress.findFirst({
      where: { user_id: userId },
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Deposit address not found",
      });
    }

    res.json({
      success: true,
      network: "TRC20",
      address: address.address,
    });
  } catch (error) {
    console.error("Get deposit address error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};