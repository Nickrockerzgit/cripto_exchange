import express from "express";
import { submitDeposit } from "../controllers/deposit.controller.js";
import authenticate from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/submit", authenticate, submitDeposit);

export default router;