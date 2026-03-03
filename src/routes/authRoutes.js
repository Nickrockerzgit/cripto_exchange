import express from 'express';
import {
  register,
  verifyEmail,
  resendOTP,
  login,
  verify2FA,
  enable2FA,
  confirmEnable2FA,
  refreshToken
} from '../controllers/authControllers.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/resend-otp', resendOTP);
router.post('/login', login);
router.post('/verify-2fa', verify2FA);
router.post('/enable-2fa', authMiddleware, enable2FA);
router.post('/confirm-2fa', authMiddleware, confirmEnable2FA);
router.post('/refresh-token', refreshToken);

export default router;