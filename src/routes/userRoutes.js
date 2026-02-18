import express from 'express';
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
} from '../controllers/userController.js';
import { getAllUsersRefrals } from '../controllers/refralsControllers.js';

import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

// 🔹 Create user (admin or internal use)
router.post('/', createUser);

// 🔹 Get all users
router.get('/', getAllUsers);
router.get('/refrals', getAllUsersRefrals);


// 🔹 Get single user
router.get('/:id', authMiddleware, getUserById);

// 🔹 Update user
router.put('/:id', authMiddleware, updateUser);

// 🔹 Delete user
router.delete('/:id', authMiddleware, deleteUser);

export default router;
