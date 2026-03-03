// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();

// export const submitDeposit = async (req, res) => {
//   try {

//     const { tx_hash, amount } = req.body;
//     const userId = req.user.id;

//     if (!tx_hash || !amount) {
//       return res.status(400).json({
//         success: false,
//         message: "TX hash and amount required"
//       });
//     }

//     const exists = await prisma.depositSubmission.findUnique({
//       where: { tx_hash }
//     });

//     if (exists) {
//       return res.status(400).json({
//         success: false,
//         message: "Transaction already submitted"
//       });
//     }

//     await prisma.depositSubmission.create({
//       data: {
//         user_id: userId,
//         amount,
//         tx_hash,
//         status: "PENDING"
//       }
//     });

//     return res.json({
//       success: true,
//       message: "Deposit submitted successfully"
//     });

//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       message: err.message
//     });
//   }
// };

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const submitDeposit = async (req, res) => {
  try {

    const { tx_hash, amount } = req.body;
    const userId = req.user.userId; // Get from authenticated user

    if (!tx_hash || !amount) {
      return res.status(400).json({
        success: false,
        message: "Transaction hash and amount are required"
      });
    }

    if (amount < 10) {
      return res.status(400).json({
        success: false,
        message: "Minimum deposit amount is $10 USDT"
      });
    }

    // Get user's deposit address
    const userDepositAddress = await prisma.depositAddress.findFirst({
      where: { user_id: userId }
    });

    if (!userDepositAddress) {
      return res.status(404).json({
        success: false,
        message: "Deposit address not found"
      });
    }

    // Check if transaction already submitted
    const exists = await prisma.depositSubmission.findUnique({
      where: { tx_hash }
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Transaction already submitted"
      });
    }

    const submission = await prisma.depositSubmission.create({
      data: {
        user_id: userId,
        amount: parseFloat(amount),
        deposit_address: userDepositAddress.address,
        tx_hash,
        status: "PENDING",
        type: "DEPOSIT"
      }
    });

    return res.json({
      success: true,
      message: "Deposit submitted successfully. Your transaction will be verified within 5-10 minutes.",
      submission: {
        id: submission.id,
        amount: submission.amount,
        status: submission.status,
        created_at: submission.created_at
      }
    });

  } catch (err) {
    console.error("Deposit submission error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to submit deposit. Please try again."
    });
  }
};