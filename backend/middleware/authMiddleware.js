const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const header = req.header('Authorization');
    if (!header) return res.status(401).json({ message: 'No token provided' });

    const token = header.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Invalid token format' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // attach user id & role to req
    req.user = { id: decoded.id, role: decoded.role };
    // optional: fetch user if needed
    req.currentUser = await User.findById(decoded.id).select('-password');
    next();
  } catch (err) {
    console.error('Auth error:', err.message || err);
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

module.exports = authMiddleware;
