
import { PrismaClient } from "@prisma/client";
import { uploadDepositScreenshot } from "../services/s3.service.js";

const prisma = new PrismaClient();

export const submitDeposit = async (req, res) => {
  try {

    const { tx_hash, deposite_address, amount, user_id } = req.body;
    const file = req.file;

    // 🔴 Basic fields validation
    if (!tx_hash || !amount || !user_id || !deposite_address) {
      return res.status(400).json({
        success: false,
        message: "tx_hash, deposite_address, amount and user_id required"
      });
    }

    // 🔴 Screenshot mandatory
    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Payment screenshot is required"
      });
    }

    // 🔴 Duplicate transaction check
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
    const screenshotKey = await uploadDepositScreenshot(file, user_id);

    // ✅ Save in DB
    const submission = await prisma.depositSubmission.create({
      data: {
        user_id,
        amount,
        deposit_address: deposite_address,
        tx_hash,
        screenshot: screenshotKey, // store key
        status: "PENDING"
      }
    });

    return res.json({
      success: true,
      message: "Deposit submitted successfully",
      submission
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};