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

  if (!blockchainTx) {
    console.log("⚠️ Blockchain TX not found:", submission.tx_hash);
    continue;
  }

  await prisma.$transaction(
    async (tx) => {

      await tx.user.update({
        where: { id: submission.user_id },
        data: { robot_status: "ACTIVE" }
      });

      await tx.depositSubmission.update({
        where: { id: submission.id },
        data: { status: "CONFIRMED" }
      });

      await tx.blockchainDeposit.update({
        where: { tx_hash: blockchainTx.tx_hash },
        data: { is_used: true }
      });

      await tx.transaction.create({
        data: {
          user_id: submission.user_id,
          type: "robot_activation",
          gross_amount: Number(blockchainTx.amount),
          net_amount: Number(blockchainTx.amount),
          status: "confirmed",
          reference_id: blockchainTx.tx_hash,
          description: "Robot activation fee",
        }
      });

    },
    { timeout: 20000 }
  );

  console.log("✅ Robot activated for user:", submission.user_id);
}
  }
}

export default new RobotActivationService();