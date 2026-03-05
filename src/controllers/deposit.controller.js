
import { PrismaClient } from "@prisma/client";
import { uploadDepositScreenshot } from "../services/s3.service.js";

const prisma = new PrismaClient();

export const submitDeposit = async (req, res) => {
  try {

    const { tx_hash, amount } = req.body;
    const userId = req.user.userId; // Get from authenticated user
    const file = req.file; // Get uploaded file from multer

    if (!tx_hash || !amount) {
      return res.status(400).json({
        success: false,
        message: "Transaction hash and amount are required"
      });
    }

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Screenshot is required"
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

    // ✅ Upload screenshot to S3
    const screenshotKey = await uploadDepositScreenshot(file, userId);

    // ✅ Save in DB
    const submission = await prisma.depositSubmission.create({
      data: {
        user_id: userId,
        amount: parseFloat(amount),
        deposit_address: userDepositAddress.address,
        tx_hash,
        screenshot: screenshotKey,
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