const mongoose = require('mongoose');
const { EXPENSE_CATEGORIES } = require('../constants');

const reminderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [60, 'Title cannot exceed 60 characters'],
    },
    amount: { type: Number, required: [true, 'Amount is required'], min: [0.01, 'Amount must be at least 0.01'] },
    dueDate: { type: Date, required: [true, 'Due date is required'] },
    repeat: { type: String, enum: { values: ['none', 'monthly'], message: 'Repeat must be none or monthly' }, default: 'none' },
    category: {
      type: String,
      enum: { values: EXPENSE_CATEGORIES, message: 'Unknown category' },
      default: 'Bills',
    },
    paid: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Reminder', reminderSchema);
