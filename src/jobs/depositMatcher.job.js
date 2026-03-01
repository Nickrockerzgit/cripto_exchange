import cron from "node-cron";
import depositMatcher from "../services/blockchain/matchDeposite.service.js";

function startDepositMatcherJob() {
  console.log("🧠 Deposit matcher started");

  cron.schedule("*/25 * * * * *", async () => {
    try {
      await depositMatcher.match();
    } catch (error) {
      console.error("Matcher failed:", error.message);
    }
  });
}

export default startDepositMatcherJob;