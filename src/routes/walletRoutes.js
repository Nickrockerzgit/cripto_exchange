import express from "express";
import { getDepositAddress } from "../controllers/walletController.js";
import authenticate from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/deposit-address", authenticate, getDepositAddress);

export default router;