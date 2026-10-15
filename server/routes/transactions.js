const express = require('express');
const mongoose = require('mongoose');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

const FIELDS = ['amount', 'type', 'category', 'date', 'paymentMethod', 'note', 'account'];

// Whitelist body fields so a client can never set user, _id or timestamps
function pick(body) {
  const out = {};
  if (body && typeof body === 'object') for (const f of FIELDS) if (body[f] !== undefined) out[f] = body[f];
  return out;
}

// Normalises body.account and checks it belongs to the caller.
// Returns an error message, or null when fine. ''/null means "no account".
async function checkAccount(data, userId) {
  if (!('account' in data)) return null;
  if (data.account === '' || data.account === null) {
    data.account = null;
    return null;
  }
  if (typeof data.account !== 'string' || !mongoose.isValidObjectId(data.account)) return 'Account not found';
  return (await Account.exists({ _id: data.account, user: userId })) ? null : 'Account not found';
}

// "2026-10" -> [2026-10-01T00:00Z, 2026-11-01T00:00Z)
function monthRange(month) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month || '')) return null;
  const [year, mon] = month.split('-').map(Number);
  return { start: new Date(Date.UTC(year, mon - 1, 1)), end: new Date(Date.UTC(year, mon, 1)) };
}

function validationMessage(err) {
  return Object.values(err.errors).map((e) => e.message).join(', ');
}

// Must be defined before /:id
router.get('/summary', async (req, res) => {
  const range = monthRange(req.query.month);
  if (!range) return res.status(400).json({ error: 'month is required in YYYY-MM format' });

  try {
    const match = {
      user: new mongoose.Types.ObjectId(req.userId),
      date: { $gte: range.start, $lt: range.end },
    };

    const [totals, byCategory] = await Promise.all([
      Transaction.aggregate([
        { $match: match },
        { $group: { _id: '$type', total: { $sum: '$amount' } } },
      ]),
      Transaction.aggregate([
        { $match: { ...match, type: 'expense' } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } },
      ]),
    ]);

    const income = totals.find((t) => t._id === 'income')?.total || 0;
    const expense = totals.find((t) => t._id === 'expense')?.total || 0;
    res.json({ income, expense, balance: income - expense, byCategory });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', async (req, res) => {
  const filter = { user: req.userId };
  if (req.query.account !== undefined) {
    if (!mongoose.isValidObjectId(req.query.account)) return res.status(400).json({ error: 'Invalid account id' });
    filter.account = req.query.account;
  }
  if (req.query.month !== undefined) {
    const range = monthRange(req.query.month);
    if (!range) return res.status(400).json({ error: 'month must be in YYYY-MM format' });
    filter.date = { $gte: range.start, $lt: range.end };
  }

  try {
    const transactions = await Transaction.find(filter).sort({ date: -1, createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = pick(req.body);
    const accountError = await checkAccount(data, req.userId);
    if (accountError) return res.status(400).json({ error: accountError });
    const transaction = await Transaction.create({ ...data, user: req.userId });
    res.status(201).json(transaction);
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ error: validationMessage(err) });
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });

  try {
    const data = pick(req.body);
    const accountError = await checkAccount(data, req.userId);
    if (accountError) return res.status(400).json({ error: accountError });
    const updated = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      data,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: 'Transaction not found' });
    res.json(updated);
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ error: validationMessage(err) });
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });

  try {
    const deleted = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!deleted) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
