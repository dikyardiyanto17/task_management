const jwt = require('jsonwebtoken');
const db = require('../models');
const { blacklistToken } = require('../services/tokenBlacklist');

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
}

async function login(req, res) {
  const { email, password } = req.body;
  const user = await db.User.findOne({ where: { email } });
  if (!user || !(await user.validatePassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  const token = signToken(user);
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}

async function logout(req, res) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    await blacklistToken(header.slice(7));
  }
  res.json({ message: 'Logged out' });
}

async function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { login, logout, me };
