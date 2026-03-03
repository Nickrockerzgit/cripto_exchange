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
function startDepositJob() {
  console.log("🚀 Deposit scanner started");

  cron.schedule("*/20 * * * * *", async () => {
    try {
      await depositScanner.scan();
    } catch (error) {
      console.error("Deposit scan failed:", error.message);
    }
  });
}

export default startDepositJob;