import adminDashboardService from "../services/adminDashboard.service.js";
import { successResponse } from "../utils/successResponse.js";
import { errorResponse } from "../utils/errorResponse.js";

const adminDashboardController = {

  getDashboardStats: async (req, res) => {
    try {

      const stats = await adminDashboardService.getDashboardStats();

      return successResponse(
        res,
        "Dashboard stats fetched successfully",
        stats
      );

    } catch (error) {
      console.error("Dashboard stats error:", error);
      return errorResponse(res, error.message, 500);
    }
  }

};

export default adminDashboardController;