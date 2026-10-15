const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Requires "Authorization: Bearer <token>" and sets req.userId
module.exports = async function auth(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: 'Authentication required' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // A token outlives a deleted account, so confirm the user still exists
    if (!(await User.exists({ _id: payload.sub }))) {
      return res.status(401).json({ error: 'Account no longer exists' });
    }
    req.userId = payload.sub;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Session expired. Please log in again' });
  }
};
