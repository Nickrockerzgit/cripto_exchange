import { PrismaClient } from "@prisma/client";
import { generateSignedUrl } from "../services/s3.service.js";

const prisma = new PrismaClient();

export const getAllDepositsForAdmin = async (req, res) => {
  try {

    const deposits = await prisma.depositSubmission.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: {
        created_at: "desc"
      }
    });

    const formattedDeposits = await Promise.all(
      deposits.map(async (deposit) => {

        let screenshotUrl = null;

        if (deposit.screenshot) {
          screenshotUrl = await generateSignedUrl(deposit.screenshot);
        }

        return {
          id: deposit.id,
          user_id: deposit.user_id,
          user_email: deposit.user?.email,
          amount: deposit.amount,
          tx_hash: deposit.tx_hash,
          deposit_address: deposit.deposit_address,
          status: deposit.status,
          created_at: deposit.created_at,
          screenshot_url: screenshotUrl
        };
      })
    );

    return res.json({
      success: true,
      deposits: formattedDeposits
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }
};