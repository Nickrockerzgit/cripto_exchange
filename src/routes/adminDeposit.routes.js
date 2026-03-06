import express from "express";
import { getAllDepositsForAdmin ,getDepositeAddress} from "../controllers/adminDeposit.controller.js";

const router = express.Router();

router.get("/deposits", getAllDepositsForAdmin);
router.get("/depositeAddress", getDepositeAddress);

export default router;