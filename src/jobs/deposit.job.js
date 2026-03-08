// const cron = require("node-cron");
// const depositScanner = require("../services/blockchain/depositScanner.service");

// function startDepositJob() {
//   console.log("🚀 Deposit scanner started");

//   cron.schedule("*/20 * * * * *", async () => {
//     await depositScanner.scan();
//   });
// }

// module.exports = startDepositJob;

import cron from "node-cron";
// import depositScanner from "../services/blockchain/depositScanner.service";
import depositScanner from "../services/blockchain/depositScanner.service.js";

let isDepositScannerRunning = false;

function startDepositJob() {
  console.log("🚀 Deposit scanner started");

  // ⚠️ CRITICAL FIX: Changed from every 20 seconds to every 2 minutes
  // This reduces constant wallet locking that causes transfer timeouts
  // Previous: "*/20 * * * * *" → Every 20 seconds (3 times per minute)
  // New: "*/120 * * * * *" → Every 2 minutes (prevents contention)
  cron.schedule("*/120 * * * * *", async () => {
    // ⚠️ ADDED: Guard to prevent overlapping scans
    if (isDepositScannerRunning) {
      console.log("⏳ Deposit scanner already running, skipping this cycle...");
      return;
    }

    try {
      isDepositScannerRunning = true;
      await depositScanner.scan();
    } catch (error) {
      console.error("Deposit scan failed:", error.message);
    } finally {
      isDepositScannerRunning = false;
    }
  });
}

export default startDepositJob;
