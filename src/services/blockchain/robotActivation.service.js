// services/robotActivation.service.js

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

class RobotActivationService {

  async process() {

    console.log("🤖 Processing robot activation requests...");

    const pendingRequests = await prisma.depositSubmission.findMany({
      where: {
        status: "PENDING",
        type: "ROBOT_ACTIVATION"
      }
    });

    for (const submission of pendingRequests) {

      const blockchainTx = await prisma.blockchainDeposit.findFirst({
        where: {
          tx_hash: submission.tx_hash,
          is_used: false,
          amount: 30
        }
      });

      if (!blockchainTx) continue;

      await prisma.$transaction(async (tx) => {

        // Final security validation
        if (Number(blockchainTx.amount) !== 30) {
          throw new Error("Invalid activation amount");
        }

        // Activate robot
        await tx.user.update({
          where: { id: submission.user_id },
          data: {
            robot_status: "ACTIVE"
          }
        });

        // Mark submission confirmed
        await tx.depositSubmission.update({
          where: { id: submission.id },
          data: { status: "CONFIRMED" }
        });

        // Mark blockchain tx used
        await tx.blockchainDeposit.update({
          where: { tx_hash: blockchainTx.tx_hash },
          data: { is_used: true }
        });

        // 🔥 Log transaction record for robot activation
        await tx.transaction.create({
          data: {
            user_id: submission.user_id,
            type: "robot_activation",
            gross_amount: Number(blockchainTx.amount) || 0,
            net_amount: Number(blockchainTx.amount) || 0,
            status: "confirmed",
            reference_id: blockchainTx.tx_hash,
            description: "Robot activation fee",
          },
        });

      });

      console.log("✅ Robot activated for user:", submission.user_id);
    }
  }
}

export default new RobotActivationService();