import jwt from 'jsonwebtoken'

/**
 * Admin Authentication Middleware
 * Verifies JWT token for admin routes
 */
async function adminAuthMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (!decoded.adminId) {
      return res.status(403).json({ error: 'Invalid admin token' })
    }

    // Attach admin info to request
    req.admin = {
      adminId: decoded.adminId,
      role: decoded.role
    }

    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' })
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Invalid token' })
    }
    res.status(500).json({ error: 'Authentication failed' })
  }
}

export default adminAuthMiddleware
