const express = require('express');
const mongoose = require('mongoose');
const Budget = require('../models/Budget');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

const message = (err) => Object.values(err.errors).map((e) => e.message).join(', ');

router.get('/', async (req, res) => {
  try {
    res.json(await Budget.find({ user: req.userId }).sort({ category: 1 }));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  const { category, limit } = req.body || {};
  try {
    const budget = await Budget.create({ user: req.userId, category, limit });
    res.status(201).json(budget);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'A budget for this category already exists' });
    if (err.name === 'ValidationError') return res.status(400).json({ error: message(err) });
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  try {
    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { limit: (req.body || {}).limit },
      { new: true, runValidators: true }
    );
    if (!budget) return res.status(404).json({ error: 'Budget not found' });
    res.json(budget);
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ error: message(err) });
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  try {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!budget) return res.status(404).json({ error: 'Budget not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
