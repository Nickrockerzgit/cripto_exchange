import express from "express";
import { submitDeposit } from "../controllers/deposit.controller.js";
// import { verifyToken } from "../middleware/auth.js";
import { upload } from "../middlewares/upload.middleware.js";
import authenticate from "../middlewares/authMiddleware.js";
const router = express.Router();

// router.post("/submit",  submitDeposit);
router.post("/submit", authenticate, upload.single("screenshot"), submitDeposit);

export default router;