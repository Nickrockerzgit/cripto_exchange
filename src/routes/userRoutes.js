import express from 'express';
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getWalletBalance,
  getTransactionHistory,
  getUserByRefralCode
} from '../controllers/userController.js';


import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

// 🔹 Create user (admin or internal use)
router.post('/', createUser);

// 🔹 Get all users
router.get('/', getAllUsers);


// 🔹 Get single user
router.get('/:id', getUserById);
router.get('/referral/:referral_code', getUserByRefralCode);



// 🔹 Update user
router.put('/:id', authMiddleware, updateUser);

// 🔹 Delete user
router.delete('/:id', authMiddleware, deleteUser);

router.get('/wallet/balance',authMiddleware,getWalletBalance)
router.get('/transaction/history',authMiddleware,getTransactionHistory)


export default router;
