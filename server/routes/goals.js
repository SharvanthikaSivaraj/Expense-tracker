const express = require('express');
const mongoose = require('mongoose');
const Goal = require('../models/Goal');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

const message = (err) => Object.values(err.errors).map((e) => e.message).join(', ');

// Whitelist; an empty deadline removes it
function shape(body) {
  const set = {};
  const unset = {};
  const b = body && typeof body === 'object' ? body : {};
  for (const f of ['name', 'target', 'saved']) if (b[f] !== undefined && b[f] !== '') set[f] = b[f];
  if (b.deadline === '' || b.deadline === null) unset.deadline = 1;
  else if (b.deadline !== undefined) set.deadline = b.deadline;
  return { set, unset };
}

router.get('/', async (req, res) => {
  try {
    res.json(await Goal.find({ user: req.userId }).sort({ createdAt: 1 }));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { set } = shape(req.body);
    res.status(201).json(await Goal.create({ ...set, user: req.userId }));
  } catch (err) {
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
    const goal = await Goal.findOneAndUpdate({ _id: req.params.id, user: req.userId }, update, {
      new: true,
      runValidators: true,
    });
    if (!goal) return res.status(404).json({ error: 'Goal not found' });
    res.json(goal);
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ error: message(err) });
    res.status(500).json({ error: 'Server error' });
  }
});

// Add (positive) or withdraw (negative) money; the saved amount never goes below zero
router.post('/:id/contribute', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  const amount = Number((req.body || {}).amount);
  if (!Number.isFinite(amount) || amount === 0) return res.status(400).json({ error: 'Enter an amount other than 0' });

  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.userId });
    if (!goal) return res.status(404).json({ error: 'Goal not found' });
    goal.saved = Math.max(0, goal.saved + amount);
    await goal.save();
    res.json(goal);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!goal) return res.status(404).json({ error: 'Goal not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
