const express = require('express');
const mongoose = require('mongoose');
const Account = require('../models/Account');
const Reminder = require('../models/Reminder');
const Transaction = require('../models/Transaction');
const { PAYMENT_METHODS } = require('../constants');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

const message = (err) => Object.values(err.errors).map((e) => e.message).join(', ');

function shape(body) {
  const set = {};
  const b = body && typeof body === 'object' ? body : {};
  for (const f of ['title', 'amount', 'dueDate', 'repeat', 'category']) {
    if (b[f] !== undefined && b[f] !== '') set[f] = b[f];
  }
  return set;
}

// Same day next month, clamped (Jan 31 -> Feb 28)
function nextMonth(date) {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m, Math.min(date.getUTCDate(), lastDay)));
}

router.get('/', async (req, res) => {
  try {
    res.json(await Reminder.find({ user: req.userId }).sort({ paid: 1, dueDate: 1 }));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    res.status(201).json(await Reminder.create({ ...shape(req.body), user: req.userId }));
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ error: message(err) });
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  try {
    const reminder = await Reminder.findOneAndUpdate({ _id: req.params.id, user: req.userId }, shape(req.body), {
      new: true,
      runValidators: true,
    });
    if (!reminder) return res.status(404).json({ error: 'Reminder not found' });
    res.json(reminder);
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ error: message(err) });
    res.status(500).json({ error: 'Server error' });
  }
});

// Paying records an expense; monthly bills roll to next month, one-off bills are marked paid
router.post('/:id/pay', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  const { paymentMethod = 'upi', account = null } = req.body || {};
  if (!PAYMENT_METHODS.includes(paymentMethod)) return res.status(400).json({ error: 'Invalid payment method' });

  try {
    const reminder = await Reminder.findOne({ _id: req.params.id, user: req.userId });
    if (!reminder) return res.status(404).json({ error: 'Reminder not found' });
    if (reminder.paid) return res.status(400).json({ error: 'This bill is already paid' });

    if (account && !(typeof account === 'string' && mongoose.isValidObjectId(account) && (await Account.exists({ _id: account, user: req.userId })))) {
      return res.status(400).json({ error: 'Account not found' });
    }

    const today = new Date();
    const transaction = await Transaction.create({
      user: req.userId,
      amount: reminder.amount,
      type: 'expense',
      category: reminder.category,
      date: new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())),
      paymentMethod,
      account: account || null,
      note: reminder.title,
    });

    if (reminder.repeat === 'monthly') reminder.dueDate = nextMonth(reminder.dueDate);
    else reminder.paid = true;
    await reminder.save();

    res.json({ reminder, transaction });
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ error: message(err) });
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  try {
    const reminder = await Reminder.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!reminder) return res.status(404).json({ error: 'Reminder not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
