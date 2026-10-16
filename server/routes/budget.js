const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// One monthly spending limit per user, stored on the user. 0 means "no budget set".
router.get('/', async (req, res) => {
  const user = await User.findById(req.userId);
  res.json({ limit: user.budget });
});

router.put('/', async (req, res) => {
  const limit = Number((req.body || {}).limit);
  if (!Number.isFinite(limit) || limit < 0) return res.status(400).json({ error: 'Limit must be 0 or more' });
  const user = await User.findByIdAndUpdate(req.userId, { budget: limit }, { new: true });
  res.json({ limit: user.budget });
});

module.exports = router;
