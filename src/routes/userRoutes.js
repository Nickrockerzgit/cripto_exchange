import express from 'express';
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getWalletBalance,
  getTransactionHistory
} from '../controllers/userController.js';
import { getAllUsersRefrals } from '../controllers/refralsControllers.js';


import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

// 🔹 Create user (admin or internal use)
router.post('/', createUser);

// 🔹 Get all users
router.get('/', getAllUsers);


// 🔹 Get single user
router.get('/:id', getUserById);

// 🔹 Update user
router.put('/:id', authMiddleware, updateUser);

// 🔹 Delete user
router.delete('/:id', authMiddleware, deleteUser);

router.get('/wallet/balance',authMiddleware,getWalletBalance)
router.get('/transaction/history',authMiddleware,getTransactionHistory)


export default router;
