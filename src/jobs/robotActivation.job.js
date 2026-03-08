import cron from "node-cron";
import robotActivationService from "../services/blockchain/robotActivation.service.js";

let isRobotProcessRunning = false;

function startRobotActivationJob() {
  console.log("🤖 Robot activation job started");

  // ⚠️ CRITICAL FIX: Changed from every 25 seconds to every 3 minutes
  // This reduces wallet locking contention with transfer operations
  // Previous: "*/25 * * * * *" → Every 25 seconds
  // New: "*/180 * * * * *" → Every 3 minutes
  cron.schedule("*/180 * * * * *", async () => {
    // ⚠️ ADDED: Guard to prevent overlapping executions
    if (isRobotProcessRunning) {
      console.log(
        "⏳ Robot activation already running, skipping this cycle...",
      );
      return;
    }

    try {
      isRobotProcessRunning = true;
      await robotActivationService.process();
    } catch (error) {
      console.error("Robot activation failed:", error.message);
    } finally {
      isRobotProcessRunning = false;
    }
  });
}

export default startRobotActivationJob;
