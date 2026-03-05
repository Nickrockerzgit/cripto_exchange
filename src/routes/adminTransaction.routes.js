import express from "express";
import { getAllTransactionsForAdmin } from "../controllers/adminTransaction.controller.js";

const router = express.Router();

// fetch transactions for admin panel (paginated, filterable)
router.get("/transactions", getAllTransactionsForAdmin);

export default router;
