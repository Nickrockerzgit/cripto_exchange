// routes/robot.routes.js

import express from "express";
import { activateRobotController,
    getRobotStatusController
} from "../controllers/robot.controller.js";
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post("/activate", authMiddleware,  activateRobotController);
router.get("/status", authMiddleware, getRobotStatusController);

export default router;