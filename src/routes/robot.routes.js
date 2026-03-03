// routes/robot.routes.js

import express from "express";
import { activateRobotController } from "../controllers/robot.controller.js";
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post("/activate",  activateRobotController);

export default router;