
// import tronWeb from "./tronClient.js";
// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();

// const USDT_CONTRACT = process.env.USDT_CONTRACT;
// const WATCH_ADDRESS = process.env.ADMIN_WALLET;

// class DepositScannerService {

//   async scan() {
//     try {

//       console.log("🔍 Scanning USDT deposits...");

//       const events = await tronWeb.getEventResult(
//         USDT_CONTRACT,
//         {
//           eventName: "Transfer",
//           size: 50,
//           onlyConfirmed: true
//         }
//       );
// console.log("Events fetched:", events);
//       const eventList = Array.isArray(events)
//         ? events
//         : events?.data || [];

//       for (const event of eventList) {

//         const txHash = event.transaction_id;

//         const to = tronWeb.address.fromHex(event.result.to);
//         const amount = Number(event.result.value) / 1_000_000;

//         // Only deposits to ADMIN WALLET
//         if (to !== WATCH_ADDRESS) continue;

//         // Already processed?
//         const alreadyCredited = await prisma.deposit.findFirst({
//           where: { blockchain_txid: txHash }
//         });

//         if (alreadyCredited) continue;

//         console.log("💰 Deposit detected:", txHash, amount);

//         // Match submission by TX HASH
//         const submission = await prisma.depositSubmission.findFirst({
//           where: {
//             tx_hash: txHash,
//             status: "PENDING"
//           }
//         });

//         if (!submission) {
//           console.log("⚠ No submission found for:", txHash);
//           continue;
//         }

//         await prisma.$transaction(async (tx) => {

//           await tx.deposit.create({
//             data: {
//               user_id: submission.user_id,
//               amount,
//               net_amount: amount,
//               blockchain_txid: txHash,
//               deposit_address: to,
//               sweep_status: "CONFIRMED",
//             },
//           });

//           await tx.wallet.update({
//             where: { user_id: submission.user_id },
//             data: {
//               main_balance: { increment: amount }
//             }
//           });

//           await tx.transaction.create({
//             data: {
//               user_id: submission.user_id,
//               type: "deposit",
//               gross_amount: amount,
//               net_amount: amount,
//               status: "confirmed",
//               reference_id: txHash,
//             }
//           });

//           await tx.depositSubmission.update({
//             where: { id: submission.id },
//             data: { status: "CONFIRMED" }
//           });

//         });

//         console.log("✅ Deposit credited to user:", submission.user_id);

//       }

//     } catch (err) {
//       console.error("❌ Deposit scan error:", err.message);
//     }
//   }
// }

// export default new DepositScannerService();
import tronWeb from "./tronClient.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const USDT_CONTRACT = process.env.USDT_CONTRACT;
const WATCH_ADDRESS = process.env.ADMIN_WALLET;

class DepositScannerService {

  async scan() {
    try {

      console.log("🔍 Scanning USDT deposits...");

      const events = await tronWeb.getEventResult(
        USDT_CONTRACT,
        {
          eventName: "Transfer",
          size: 50,
          onlyConfirmed: true
        }
      );
      const eventList = Array.isArray(events)
        ? events
        : events?.data || [];

      for (const event of eventList) {

        const txHash = event.transaction_id;
        const to = tronWeb.address.fromHex(event.result.to);
        const from = tronWeb.address.fromHex(event.result.from);
        const amount = Number(event.result.value) / 1_000_000;

        // 👉 Only deposits to ADMIN WALLET
        if (to !== WATCH_ADDRESS) continue;

        console.log("💰 Blockchain Deposit Found:", txHash, amount);

        // STEP 1 — Save blockchain deposit (if not already saved)
        const existingBlockchainTx = await prisma.blockchainDeposit.findUnique({
          where: { tx_hash: txHash }
        });

        if (!existingBlockchainTx) {
          await prisma.blockchainDeposit.create({
            data: {
              tx_hash: txHash,
              from_addr: from,
              to_addr: to,
              amount,
              confirmations: 1,
              is_used: false
            }
          });

          console.log("📦 Stored in BlockchainDeposit table");
        }

        // STEP 2 — Find matching user submission
       const submission = await prisma.depositSubmission.findFirst({
  where: {
    tx_hash: txHash,
    status: "PENDING",
    type: "DEPOSIT"   // 👈 ONLY NORMAL DEPOSITS
  }
});

        if (submission) {
          console.log("⚠ No user submission yet for:", txHash);
          continue;
        }

        // STEP 3 — Check blockchain record again
        const blockchainTx = await prisma.blockchainDeposit.findUnique({
          where: { tx_hash: txHash }
        });

        if (!blockchainTx || blockchainTx.is_used) {
          console.log("⚠ Already used or missing:", txHash);
          continue;
        }

        // STEP 4 — SECURITY MATCH
        if (Number(submission.amount) !== Number(blockchainTx.amount)) {
          console.log("❌ Amount mismatch");
          continue;
        }

        await prisma.$transaction(async (tx) => {

          // Deposit record
          await tx.deposit.create({
            data: {
              user_id: submission.user_id,
              amount,
              net_amount: amount,
              blockchain_txid: txHash,
              deposit_address: to,
              sweep_status: "CONFIRMED"
            }
          });

        

          // Wallet credit
          await tx.wallet.upsert({
            where: { user_id: submission.user_id },
            update: {
              main_balance: { increment: amount }
            },
            create: {
              user_id: submission.user_id,
              main_balance: amount
            }
          });

          // Transaction log
          await tx.transaction.create({
            data: {
              user_id: submission.user_id,
              type: "deposit",
              gross_amount: amount,
              net_amount: amount,
              status: "confirmed",
              reference_id: txHash,
            }
          });

          // Mark submission confirmed
          await tx.depositSubmission.update({
            where: { id: submission.id },
            data: { status: "CONFIRMED" }
          });

          // Mark blockchain tx used
          await tx.blockchainDeposit.update({
            where: { tx_hash: txHash },
            data: { is_used: true }
          });

        }, {
          timeout: 15000 // 15 seconds timeout for S3 upload + DB operations
        });

        console.log("✅ Deposit Credited to:", submission.user_id);

      }

    } catch (err) {
      console.error("❌ Deposit scan error:", err.message);
    }
  }
}

export default new DepositScannerService();