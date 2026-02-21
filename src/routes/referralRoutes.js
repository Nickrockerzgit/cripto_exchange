import express from 'express';

import { getAllRefralsByUserId } from '../controllers/refralsControllers.js';

import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();
// 🔹 Get all referrals of a user

router.get('/:id', getAllRefralsByUserId);


export default router;
