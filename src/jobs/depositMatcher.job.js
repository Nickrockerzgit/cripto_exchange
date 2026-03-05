// import cron from "node-cron";
// import depositMatcher from "../services/blockchain/matchDeposite.service.js";

// function startDepositMatcherJob() {
//   console.log("🧠 Deposit matcher started");

//   cron.schedule("*/25 * * * * *", async () => {
//     try {
//       await depositMatcher.match();
//     } catch (error) {
//       console.error("Matcher failed:", error.message);
//     }
//   });
// }

// export default startDepositMatcherJob;













import cron from "node-cron";
import depositMatcher from "../services/blockchain/matchDeposite.service.js";

let isRunning = false;

function startDepositMatcherJob() {
  console.log("🧠 Deposit matcher started");

  cron.schedule("*/60 * * * * *", async () => {

    if (isRunning) {
      console.log("⏳ Matcher already running, skipping...");
      return;
    }

    try {
      isRunning = true;
      await depositMatcher.match();
    } catch (error) {
      console.error("Matcher failed:", error.message);
    } finally {
      isRunning = false;
    }

  });
}

export default startDepositMatcherJob;