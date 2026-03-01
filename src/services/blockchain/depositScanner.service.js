// import tronWeb from "./tronClient.js";
// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();

// const USDT_CONTRACT = process.env.USDT_CONTRACT;
// const WATCH_ADDRESS = process.env.ADMIN_WALLET; // 👈 your admin wallet

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

//       const eventList = Array.isArray(events)
//         ? events
//         : events?.data || [];

//       for (const event of eventList) {

//         const txHash = event.transaction_id;

//         const to = tronWeb.address.fromHex(event.result.to);
//         const from = tronWeb.address.fromHex(event.result.from);
//         const amount = Number(event.result.value) / 1_000_000;

//         // 👇 Only detect deposits to ADMIN wallet
//         if (to !== WATCH_ADDRESS) continue;

//         // 👇 Already processed ?
//         const exists = await prisma.deposit.findFirst({
//           where: { blockchain_txid: txHash }
//         });

//         if (exists) continue;

//         console.log("💰 Deposit detected:", txHash, amount);

//         // 👇 Match USER using sender address
//         const user = await prisma.user.findFirst({
//           where: {
//             deposit_from_address: from
//           }
//         });

//         if (!user) {
//           console.log("⚠ Unknown sender:", from);
//           continue;
//         }
        

//         await prisma.$transaction(async (tx) => {

//           await tx.deposit.create({
//             data: {
//               user_id: user.id,
//               amount,
//               net_amount: amount,
//               blockchain_txid: txHash,
//               deposit_address: to,
//               from_address: from,
//               sweep_status: "PENDING",
//             },
//           });

//           await tx.wallet.update({
//             where: { user_id: user.id },
//             data: {
//               main_balance: { increment: amount }
//             }
//           });

//           await tx.transaction.create({
//             data: {
//               user_id: user.id,
//               type: "deposit",
//               gross_amount: amount,
//               net_amount: amount,
//               status: "confirmed",
//               reference_id: txHash,
//             }
//           });

//         });

//         console.log("✅ Deposit credited to user:", user.id);

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
console.log("Events fetched:", events);
      const eventList = Array.isArray(events)
        ? events
        : events?.data || [];

      for (const event of eventList) {

        const txHash = event.transaction_id;

        const to = tronWeb.address.fromHex(event.result.to);
        const amount = Number(event.result.value) / 1_000_000;

        // Only deposits to ADMIN WALLET
        if (to !== WATCH_ADDRESS) continue;

        // Already processed?
        const alreadyCredited = await prisma.deposit.findFirst({
          where: { blockchain_txid: txHash }
        });

        if (alreadyCredited) continue;

        console.log("💰 Deposit detected:", txHash, amount);

        // Match submission by TX HASH
        const submission = await prisma.depositSubmission.findFirst({
          where: {
            tx_hash: txHash,
            status: "PENDING"
          }
        });

        if (!submission) {
          console.log("⚠ No submission found for:", txHash);
          continue;
        }

        await prisma.$transaction(async (tx) => {

          await tx.deposit.create({
            data: {
              user_id: submission.user_id,
              amount,
              net_amount: amount,
              blockchain_txid: txHash,
              deposit_address: to,
              sweep_status: "CONFIRMED",
            },
          });

          await tx.wallet.update({
            where: { user_id: submission.user_id },
            data: {
              main_balance: { increment: amount }
            }
          });

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

          await tx.depositSubmission.update({
            where: { id: submission.id },
            data: { status: "CONFIRMED" }
          });

        });

        console.log("✅ Deposit credited to user:", submission.user_id);

      }

    } catch (err) {
      console.error("❌ Deposit scan error:", err.message);
    }
  }
}

export default new DepositScannerService();