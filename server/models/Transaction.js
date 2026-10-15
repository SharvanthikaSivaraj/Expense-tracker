const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be at least 0.01'],
    },
    type: {
      type: String,
      required: [true, 'Type is required'],
      enum: { values: ['income', 'expense'], message: 'Type must be income or expense' },
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: {
        values: ['cash', 'card', 'upi', 'bank'],
        message: 'Payment method must be cash, card, upi or bank',
      },
    },
    note: {
      type: String,
      trim: true,
      maxlength: [200, 'Note cannot exceed 200 characters'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
