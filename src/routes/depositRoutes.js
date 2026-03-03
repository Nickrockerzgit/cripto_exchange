import express from "express";
import { submitDeposit } from "../controllers/deposit.controller.js";
// import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/submit",  submitDeposit);

export default router;