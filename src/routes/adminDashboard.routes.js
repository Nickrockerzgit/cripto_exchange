import express from "express";
import adminDashboardController from "../controllers/adminDashboardController.js";
import adminAuthMiddleware from "../middlewares/adminAuthMiddleware.js";

const router = express.Router();

router.get(
  "/dashboard/stats",
  adminAuthMiddleware,
  adminDashboardController.getDashboardStats
);

export default router;