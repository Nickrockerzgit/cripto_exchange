// This is a sample auth middleware; add to your folder if not exists
import jwt from 'jsonwebtoken';
function authMiddleware(req, res, next) {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Export as both default and named export for compatibility
export default authMiddleware;
export const protect = authMiddleware;