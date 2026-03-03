import express from "express";
import { createWallet } from "../controllers/createwallet.controller.js";

const router = express.Router();

router.post("/create", createWallet);

export default router;