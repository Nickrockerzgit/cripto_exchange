import express from "express";
import { getAllDepositsForAdmin } from "../controllers/adminDeposit.controller.js";

const router = express.Router();

router.get("/deposits", getAllDepositsForAdmin);

export default router;