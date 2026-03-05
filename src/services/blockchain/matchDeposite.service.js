import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

class DepositMatcherService {

  async match() {

    console.log("🔄 Matching deposits...");

   const pendingSubmissions = await prisma.depositSubmission.findMany({
  where: { 
    status: "PENDING",
    type: "DEPOSIT"
  }
});

    for (const submission of pendingSubmissions) {

      const blockchainTx = await prisma.blockchainDeposit.findFirst({
        where: {
          tx_hash: submission.tx_hash,
          is_used: false,
          amount: submission.amount
        }
      });

      if (!blockchainTx) continue;

      await prisma.$transaction(async (tx) => {

        await tx.deposit.create({
          data: {
            user_id: submission.user_id,
            amount: blockchainTx.amount,
            net_amount: blockchainTx.amount,
            blockchain_txid: blockchainTx.tx_hash,
            deposit_address: blockchainTx.to_addr,
            sweep_status: "CONFIRMED"
          }
        });

        await tx.wallet.update({
          where: { user_id: submission.user_id },
          data: {
            main_balance: { increment: blockchainTx.amount }
          }
        });

        await tx.transaction.create({
          data: {
            user_id: submission.user_id,
            type: "deposit",
            gross_amount: blockchainTx.amount,
            net_amount: blockchainTx.amount,
            status: "confirmed",
            reference_id: blockchainTx.tx_hash,
          }
        });

        await tx.depositSubmission.update({
          where: { id: submission.id },
          data: { status: "CONFIRMED" }
        });

        await tx.blockchainDeposit.update({
          where: { tx_hash: blockchainTx.tx_hash },
          data: { is_used: true }
        });

      }, {
        timeout: 15000 // 15 seconds timeout for deposit matching operations
      });

      console.log("✅ Deposit matched & credited:", submission.user_id);
    }
  }
}

export default new DepositMatcherService();