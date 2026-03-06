import express from 'express'
import {
  adminLogin,
  adminRefreshToken,
  adminLogout
} from '../controllers/adminAuthController.js'
import adminAuthMiddleware from '../middlewares/adminAuthMiddleware.js'

const router = express.Router()

// Public routes
router.post('/login', adminLogin)
router.post('/refresh-token', adminRefreshToken)

// Protected routes
router.post('/logout', adminAuthMiddleware, adminLogout)

export default router
