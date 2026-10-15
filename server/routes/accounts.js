const express = require('express');
const mongoose = require('mongoose');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

const FIELDS = ['name', 'type', 'openingBalance', 'network', 'last4', 'expiry', 'creditLimit', 'color'];
const CARD_FIELDS = ['network', 'last4', 'expiry', 'creditLimit'];

// Whitelist body fields, then drop card details that make no sense for the account type.
// Returns the values to set and the fields to remove.
function shape(body) {
  const set = {};
  if (body && typeof body === 'object') {
    for (const f of FIELDS) if (body[f] !== undefined && body[f] !== '') set[f] = body[f];
  }
  const unset = {};
  const isCard = set.type === 'credit_card' || set.type === 'debit_card';
  for (const f of CARD_FIELDS) {
    if (!isCard || (f === 'creditLimit' && set.type !== 'credit_card')) {
      delete set[f];
      unset[f] = 1;
    }
  }
  return { set, unset };
}

function message(err) {
  return Object.values(err.errors).map((e) => e.message).join(', ');
}

// Balance = opening balance + income - expense of the linked transactions (computed, never stored)
async function withTotals(userId, accounts) {
  const rows = await Transaction.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId), account: { $ne: null } } },
    { $group: { _id: { account: '$account', type: '$type' }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);
  const byAccount = new Map();
  for (const r of rows) {
    const key = r._id.account.toString();
    const entry = byAccount.get(key) || { income: 0, expense: 0, transactionCount: 0 };
    entry[r._id.type] = r.total;
    entry.transactionCount += r.count;
    byAccount.set(key, entry);
  }
  return accounts.map((a) => {
    const t = byAccount.get(a._id.toString()) || { income: 0, expense: 0, transactionCount: 0 };
    return { ...a.toJSON(), ...t, balance: a.openingBalance + t.income - t.expense };
  });
}

router.get('/', async (req, res) => {
  try {
    const accounts = await Account.find({ user: req.userId }).sort({ createdAt: 1 });
    res.json(await withTotals(req.userId, accounts));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { set } = shape(req.body);
    const account = await Account.create({ ...set, user: req.userId });
    const [result] = await withTotals(req.userId, [account]);
    res.status(201).json(result);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'You already have an account with this name' });
    if (err.name === 'ValidationError') return res.status(400).json({ error: message(err) });
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });

  try {
    const { set, unset } = shape(req.body);
    const update = { $set: set };
    if (Object.keys(unset).length) update.$unset = unset;
    const account = await Account.findOneAndUpdate({ _id: req.params.id, user: req.userId }, update, {
      new: true,
      runValidators: true,
    });
    if (!account) return res.status(404).json({ error: 'Account not found' });
    const [result] = await withTotals(req.userId, [account]);
    res.json(result);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'You already have an account with this name' });
    if (err.name === 'ValidationError') return res.status(400).json({ error: message(err) });
    res.status(500).json({ error: 'Server error' });
  }
});

// Deleting an account keeps its transactions, they simply become unlinked
router.delete('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });

  try {
    const account = await Account.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!account) return res.status(404).json({ error: 'Account not found' });
    const { modifiedCount } = await Transaction.updateMany(
      { user: req.userId, account: account._id },
      { $set: { account: null } }
    );
    res.json({ message: 'Deleted', unlinked: modifiedCount });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
