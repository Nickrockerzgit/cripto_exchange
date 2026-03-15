import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import speakeasy from 'speakeasy'
import qrcode from 'qrcode'
import { nanoid } from 'nanoid'
import { generateOTP } from '../utils/otpGenerator.js'
import {
  emailVerificationTemplate,
  twoFactorSetupTemplate,
  twoFactorLoginTemplate,
} from '../utils/emailTemplates.js'
import { sendEmail } from '../services/emailService.js'
import { handleReferralOnRegister } from '../controllers/refralsControllers.js'
import {performance} from 'perf_hooks'
const prisma = new PrismaClient()

async function register(req, res) {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🆕 NEW REGISTRATION REQUEST');
    console.log('='.repeat(60));
    const { name, email, phone, password } = req.body
    console.log('📝 Registration Data:');
    console.log('   Name:', name);
    console.log('   Email:', email);
    console.log('   Phone:', phone);
    const referralCodeFromParam = req.query.ref || req.body.referralCode;
    console.log('   Referral Code:', referralCodeFromParam || 'None');
    console.log('='.repeat(60));

    // Check if user already exists and get referral rank
    const [referral_rank, existingUser] = await Promise.all([
      prisma.referralRank.findUnique({ where: { rank_name: 'Level 1' } }),
      prisma.user.findUnique({ where: { email } })
    ]);

    if (existingUser) {
      console.log('❌ Email already exists:', email);
      return res.status(400).json({ error: 'Email already registered' })
    }

    // 1. Parallel fetch role and referral rank

    if (!referral_rank) {
      throw new Error("Level 1 referral rank not found in database")
    }
    const password_hash = await bcrypt.hash(password, 10)
    const generatedReferralCode = generateReferralCode()
    const otp = generateOTP()
    // 2. Create User
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password_hash,
        status: 'PENDING',
        email_verify_token: otp,
        referral_code: generatedReferralCode,
        referral_rank_id: referral_rank.id,
      },
    })
    // 4. Create wallet, deposit address, and user role in parallel
    await Promise.all([
      prisma.wallet.create({ data: { user_id: user.id } }),
    ]);

    // 5. Handle Referral via Service
    if (referralCodeFromParam) {
      handleReferralOnRegister(referralCodeFromParam, user.id);
    }

    // 6. Send email with OTP
    console.log(`📧 Preparing to send OTP email to: ${email}`);
    const html = emailVerificationTemplate(otp)
    const emailResult = await sendEmail(email, "Verify Your Email", html);
    
    if (!emailResult.success) {
      console.error('⚠️ Email sending failed but user created. Email error:', emailResult.error);
      // User is still created, but we inform them
      return res.status(201).json({
        message: 'User registered. Email sending failed - please try resend OTP.',
        userId: user.id,
        emailWarning: 'Email could not be sent. Use resend OTP option.',
      });
    }
    
    console.log(`✅ OTP email sent successfully to: ${email}`);
    res.status(201).json({
      message: 'User registered. Verify email with OTP.',
      userId: user.id,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Registration failed' })
  }
}
async function verifyEmail(req, res) {
  const { email, otp } = req.body

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || user.email_verify_token !== otp) {
    return res.status(400).json({ error: 'Invalid OTP' })
  }
  // Verify email
  await prisma.user.update({
    where: { email },
    data: {
      is_email_verified: true,
      email_verify_token: null, // Clear token
      status: 'ACTIVE',
    },
  })

  res.json({ message: 'Email verified successfully' })
}

async function resendOTP(req, res) {
  try {
    const { email } = req.body

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (user.is_email_verified) {
      return res.status(400).json({ error: 'Email already verified' })
    }

    // Generate new OTP
    const otp = generateOTP()

    // Update user with new OTP
    await prisma.user.update({
      where: { email },
      data: {
        email_verify_token: otp,
      },
    })

    // Send email with new OTP
    console.log(`📧 Resending OTP email to: ${email}`);
    const html = emailVerificationTemplate(otp)
    const emailResult = await sendEmail(email, 'Verify Your Email', html)
    
    if (!emailResult.success) {
      console.error('❌ Failed to resend OTP email:', emailResult.error);
      return res.status(500).json({ 
        error: 'Failed to send email. Please try again later.',
        details: emailResult.error 
      });
    }
    
    console.log(`✅ OTP resent successfully to: ${email}`);
    res.json({ message: 'OTP sent successfully' })
  } catch (error) {
    console.error('❌ Resend OTP error:', error)
    res.status(500).json({ error: 'Failed to resend OTP' })
  }
}

async function login(req, res) {
  const { email, password } = req.body

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.is_email_verified) {
    return res
      .status(400)
      .json({ error: 'User not found or email not verified' })
  }

  // Check password
  const isMatch = await bcrypt.compare(password, user.password_hash)
  if (!isMatch) {
    // Increment login attempts
     prisma.user.update({
      where: { email },
      data: { login_attempts: { increment: 1 } },
    })
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  // Reset attempts
   prisma.user.update({
    where: { email },
    data: { login_attempts: 0 },
  })

  // If 2FA enabled, send alert and require 2FA
  if (user.two_factor_enabled) {
    const html = twoFactorLoginTemplate()
     sendEmail(email, '2FA Login Attempt', html)
    // Generate a temp token for 2FA step
    const tempToken = jwt.sign(
      { userId: user.id, step: '2fa' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' },
    )
    return res.json({ message: 'Enter 2FA code', tempToken })
  }

  // Generate JWT
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  })
  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.REFRESH_SECRET,
    { expiresIn: '7d' },
  )

  // Save refresh token
   prisma.user.update({
    where: { id: user.id },
    data: { refresh_token: refreshToken },
  })

  return res.json({
    token,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      robotStatus: user.robot_status, // map if needed
      accountStatus: user.status, // map if needed
      createdAt: user.created_at, // map if needed
      referralCode: user.referral_code, // map if needed
    },
  })
}

async function verify2FA(req, res) {
  const { tempToken, code } = req.body

  try {
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET)
    if (decoded.step !== '2fa') {
      return res.status(400).json({ error: 'Invalid token' })
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } })
    if (!user.two_factor_enabled) {
      return res.status(400).json({ error: '2FA not enabled' })
    }

    // Verify TOTP
    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: code,
    })

    if (!verified) {
      return res.status(400).json({ error: 'Invalid 2FA code' })
    }

    // Generate JWT
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    })
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.REFRESH_SECRET,
      { expiresIn: '7d' },
    )

    // Save refresh token
    await prisma.user.update({
      where: { id: user.id },
      data: { refresh_token: refreshToken },
    })

    res.json({ token, refreshToken })
  } catch (error) {
    res.status(400).json({ error: 'Invalid token' })
  }
}

// src/controllers/authController.js (enable2FA function ke andar)
async function enable2FA(req, res) {
  const { userId } = req.user

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (user.two_factor_enabled) {
    return res.status(400).json({ error: '2FA already enabled' })
  }

  const secret = speakeasy.generateSecret({ length: 20 })

  const otpauthUrl = speakeasy.otpauthURL({
    secret: secret.ascii,
    label: `TradePro:${user.email}`,
    issuer: 'TradePro',
  })

  // QR code ko base64 string me convert kar (frontend me display ke liye)
  const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl, {
    width: 300,
  })

  // Also create buffer for email
  const qrBuffer = await qrcode.toBuffer(otpauthUrl, {
    type: 'png',
    width: 300,
  })

  const html = twoFactorSetupTemplate()

  // Send email with embedded attachment (optional backup)
  await sendEmail(user.email, 'Setup 2FA', html, [
    {
      filename: 'qr-code.png',
      content: qrBuffer,
      cid: 'qr-code',
    },
  ])

  // Response me QR code image (base64) aur secret dono bhej
  res.json({
    message: 'Scan the QR code or use manual key to setup 2FA',
    qrCode: qrCodeDataUrl, // Base64 image data URL
    secret: secret.base32,  // Manual entry key
  })
}

async function confirmEnable2FA(req, res) {
  const { userId } = req.user
  const { code, secret } = req.body

  const verified = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: code,
  })

  if (!verified) {
    return res.status(400).json({ error: 'Invalid code' })
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      two_factor_enabled: true,
      two_factor_secret: secret,
    },
  })

  res.json({ message: '2FA enabled successfully' })
}

async function refreshToken(req, res) {
  const { refreshToken } = req.body

  const user = await prisma.user.findFirst({
    where: { refresh_token: refreshToken },
  })
  if (!user) {
    return res.status(403).json({ error: 'Invalid refresh token' })
  }

  try {
    jwt.verify(refreshToken, process.env.REFRESH_SECRET)
    const newToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    })
    res.json({ token: newToken })
  } catch (error) {
    res.status(403).json({ error: 'Invalid refresh token' })
  }
}
const generateReferralCode = () => {
  return nanoid(8) // 8 character unique code
}

export {
  register,
  verifyEmail,
  resendOTP,
  login,
  verify2FA,
  enable2FA,
  confirmEnable2FA,
  refreshToken,
}
