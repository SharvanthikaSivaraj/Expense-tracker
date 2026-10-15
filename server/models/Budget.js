const mongoose = require('mongoose');
const { EXPENSE_CATEGORIES } = require('../constants');

// category 'ALL' is the overall monthly budget
const budgetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: { values: ['ALL', ...EXPENSE_CATEGORIES], message: 'Unknown category' },
    },
    limit: { type: Number, required: [true, 'Limit is required'], min: [1, 'Limit must be at least 1'] },
  },
  { timestamps: true }
);
budgetSchema.index({ user: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
