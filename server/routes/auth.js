const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const Account = require('../models/Account');
const Budget = require('../models/Budget');
const Goal = require('../models/Goal');
const Reminder = require('../models/Reminder');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const { validateEmail } = require('../utils/email');

const router = express.Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT) || 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Try again in a few minutes.' },
});

const sign = (user) =>
  jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// Compared against when the email is unknown, so timing does not reveal which emails exist
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

const isString = (v) => typeof v === 'string';

function passwordProblem(password) {
  if (!isString(password) || password.length < 8) return 'Password must be at least 8 characters';
  if (password.length > 72) return 'Password cannot exceed 72 characters';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Password must contain a letter and a number';
  return null;
}

router.post('/register', limiter, async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!isString(name) || !isString(email)) return res.status(400).json({ error: 'Name and email are required' });
  const problem = passwordProblem(password);
  if (problem) return res.status(400).json({ error: problem });

  const emailCheck = await validateEmail(email);
  if (!emailCheck.ok) return res.status(400).json({ error: emailCheck.error, suggestion: emailCheck.suggestion });

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email: emailCheck.email, passwordHash });
    res.status(201).json({ token: sign(user), user });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'An account with this email already exists' });
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: Object.values(err.errors).map((e) => e.message).join(', ') });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', limiter, async (req, res) => {
  const { email, password } = req.body || {};
  if (!isString(email) || !isString(password)) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash');
    const ok = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
    if (!user || !ok) return res.status(401).json({ error: 'Invalid email or password' });
    res.json({ token: sign(user), user });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.userId);
  res.json(user);
});

router.put('/me', auth, async (req, res) => {
  const { name } = req.body || {};
  if (!isString(name)) return res.status(400).json({ error: 'Name is required' });
  try {
    const user = await User.findByIdAndUpdate(req.userId, { name }, { new: true, runValidators: true });
    res.json(user);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: Object.values(err.errors).map((e) => e.message).join(', ') });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/me/password', auth, limiter, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!isString(currentPassword)) return res.status(400).json({ error: 'Current password is required' });
  const problem = passwordProblem(newPassword);
  if (problem) return res.status(400).json({ error: problem });

  try {
    const user = await User.findById(req.userId).select('+passwordHash');
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/me', auth, limiter, async (req, res) => {
  const { password } = req.body || {};
  if (!isString(password)) return res.status(400).json({ error: 'Password is required to delete your account' });

  try {
    const user = await User.findById(req.userId).select('+passwordHash');
    if (!(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(400).json({ error: 'Password is incorrect' });
    }
    await Transaction.deleteMany({ user: user._id });
    await Account.deleteMany({ user: user._id });
    await Budget.deleteMany({ user: user._id });
    await Goal.deleteMany({ user: user._id });
    await Reminder.deleteMany({ user: user._id });
    await user.deleteOne();
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
