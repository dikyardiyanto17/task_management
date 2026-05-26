const jwt = require('jsonwebtoken');
const db = require('../models');
const { isTokenBlacklisted } = require('../services/tokenBlacklist');

async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  const token = header.slice(7);
  try {
    if (await isTokenBlacklisted(token)) {
      return res.status(401).json({ message: 'Token revoked' });
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db.User.findByPk(payload.id, {
      attributes: { exclude: ['password'] },
    });
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
