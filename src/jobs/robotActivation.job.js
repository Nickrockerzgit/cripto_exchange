import cron from "node-cron";
import robotActivationService from "../services/blockchain/robotActivation.service.js";

function startRobotActivationJob() {
  console.log("🤖 Robot activation job started");

  cron.schedule("*/25 * * * * *", async () => {
    try {
      await robotActivationService.process();
    } catch (error) {
      console.error("Robot activation failed:", error.message);
    }
  });
}

export default startRobotActivationJob;