const express = require('express');
const {  
  register,
  verifyEmail,
  login,
  verify2FA,
  enable2FA,
  confirmEnable2FA,
  refreshToken, } = require('../controllers/authControllers');
// Assume you have authMiddleware in middlewares for protected routes
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/login', login);
router.post('/verify-2fa', verify2FA);
router.post('/enable-2fa', authMiddleware, enable2FA);
router.post('/confirm-2fa', authMiddleware, confirmEnable2FA);
router.post('/refresh-token', refreshToken);

module.exports = router;