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
import { generateTronAddress } from '../utils/tronAddressGenerator.js'

const prisma = new PrismaClient()

async function register(req, res) {
  try {
    const { name, email, phone, password } = req.body
    const referralCodeFromParam = req.query.ref

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' })
    }
    const role = await prisma.role.findUnique({
      where: { role_name: 'USER' },
    })
    const referral_rank = await prisma.referralRank.findUnique({
      where: { rank_name: 'Level 1' },
    })

    if (!role) {
  throw new Error("USER role not found in database")
}

if (!referral_rank) {
  throw new Error("Level 1 referral rank not found in database")
}
    const password_hash = await bcrypt.hash(password, 10)
    const generatedReferralCode = generateReferralCode()
    const otp = generateOTP()

    // 🔹 Create User
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password_hash,
        robot_status: 'INACTIVE',
        email_verify_token: otp,
        referral_code: generatedReferralCode,
        referral_rank_id: referral_rank.id,
      },
    })

    // 🔹 Generate and assign deposit address
const lastAddress = await prisma.depositAddress.findFirst({
  orderBy: {
    index_no: 'desc'
  }
})

const newIndex = lastAddress ? Number(lastAddress.index_no) + 1 : 0

const { address, index } = generateTronAddress(newIndex)

await prisma.depositAddress.create({
  data: {
    user_id: user.id,
    address: address,
    index_no: index
  }
})

    //  Create Wallet
    // await prisma.wallet.create({
    //   data: { user_id: user.id },
    // })

    //creating role
    await prisma.userRole.create({
      data: { user_id: user.id, role_id: role.id },
    })

    // 🔹 Handle Referral via Service
    await handleReferralOnRegister(referralCodeFromParam, user.id)

    console.log("address",address);

    const html = emailVerificationTemplate(otp)
    await sendEmail(email, "Verify Your Email", html);

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

async function login(req, res) {
  const { email, password } = req.body

  const user = await prisma.user.findUnique({ where: { email } })
  // if (!user || !user.is_email_verified) {
  //   return res
  //     .status(400)
  //     .json({ error: 'User not found or email not verified' })
  // }

  if (!user) {
  return res
    .status(400)
    .json({ error: 'User not found' })
}
  // Check password
  const isMatch = await bcrypt.compare(password, user.password_hash)
  if (!isMatch) {
    // Increment login attempts
    await prisma.user.update({
      where: { email },
      data: { login_attempts: { increment: 1 } },
    })
    return res.status(400).json({ error: 'Invalid credentials' })
  }

  // Reset attempts
  await prisma.user.update({
    where: { email },
    data: { login_attempts: 0 },
  })

  // If 2FA enabled, send alert and require 2FA
  if (user.two_factor_enabled) {
    const html = twoFactorLoginTemplate()
    await sendEmail(email, '2FA Login Attempt', html)
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
  await prisma.user.update({
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
    label: `YourApp:${user.email}`,
    issuer: 'YourApp',
  })

  // QR code ko Buffer mein convert kar (base64 nahi, binary buffer)
  const qrBuffer = await qrcode.toBuffer(otpauthUrl, {
    type: 'png',
    width: 300, // size adjust kar sakta hai
  })

  const html = twoFactorSetupTemplate() // Ab without qrCodeUrl

  // Send email with embedded attachment
  await sendEmail(user.email, 'Setup 2FA', html, [
    {
      filename: 'qr-code.png',
      content: qrBuffer,
      cid: 'qr-code', // Yeh important! img src="cid:qr-code" se match karega
    },
  ])

  // Response mein secret bhej (user manually daal sake agar QR na dikhe)
  res.json({
    message:
      'Check your email for QR code to scan. If not visible, use this secret manually in your app.',
    secret: secret.base32,
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
  login,
  verify2FA,
  enable2FA,
  confirmEnable2FA,
  refreshToken,
}
