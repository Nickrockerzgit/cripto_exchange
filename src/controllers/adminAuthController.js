import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()


/**
 * Admin Login
 * Authenticate admin and return JWT tokens
 */
async function adminLogin(req, res) {
  try {
    const { email, password } = req.body

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Find admin
    const admin = await prisma.admin.findUnique({
      where: { email }
    })

    if (!admin) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, admin.password_hash)
    if (!isPasswordValid) {
      // Increment login attempts
      await prisma.admin.update({
        where: { email },
        data: { login_attempts: { increment: 1 } }
      })
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Reset login attempts on successful login
    await prisma.admin.update({
      where: { email },
      data: { login_attempts: 0 }
    })

    // Generate JWT tokens
    const token = jwt.sign(
      { adminId: admin.id, role: 'ADMIN' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    )

    const refreshToken = jwt.sign(
      { adminId: admin.id, role: 'ADMIN' },
      process.env.REFRESH_SECRET,
      { expiresIn: '7d' }
    )

    // Save refresh token
    await prisma.admin.update({
      where: { id: admin.id },
      data: { refresh_token: refreshToken }
    })

    res.json({
      message: 'Login successful',
      token,
      refreshToken,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        createdAt: admin.created_at
      }
    })
  } catch (error) {
    console.error('Admin Login Error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
}

/**
 * Admin Refresh Token
 * Generate new access token using refresh token
 */
async function adminRefreshToken(req, res) {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' })
    }

    // Find admin with this refresh token
    const admin = await prisma.admin.findFirst({
      where: { refresh_token: refreshToken }
    })

    if (!admin) {
      return res.status(403).json({ error: 'Invalid refresh token' })
    }

    try {
      jwt.verify(refreshToken, process.env.REFRESH_SECRET)
    } catch (error) {
      return res.status(403).json({ error: 'Refresh token expired' })
    }

    // Generate new access token
    const newToken = jwt.sign(
      { adminId: admin.id, role: 'ADMIN' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    )

    res.json({
      message: 'Token refreshed successfully',
      token: newToken
    })
  } catch (error) {
    console.error('Admin Refresh Token Error:', error)
    res.status(500).json({ error: 'Token refresh failed' })
  }
}

/**
 * Admin Logout
 * Clear refresh token
 */
async function adminLogout(req, res) {
  try {
    const { adminId } = req.admin

    await prisma.admin.update({
      where: { id: adminId },
      data: { refresh_token: null }
    })

    res.json({ message: 'Logout successful' })
  } catch (error) {
    console.error('Admin Logout Error:', error)
    res.status(500).json({ error: 'Logout failed' })
  }
}

export {
  adminLogin,
  adminRefreshToken,
  adminLogout
}
