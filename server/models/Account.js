const mongoose = require('mongoose');

const TYPES = ['bank', 'cash', 'wallet', 'credit_card', 'debit_card'];
const CARD_TYPES = ['credit_card', 'debit_card'];
const NETWORKS = ['visa', 'mastercard', 'rupay', 'amex', 'other'];
const COLORS = ['teal', 'indigo', 'amber', 'rose', 'slate'];

// Only the last four digits and expiry are stored. Never a full card number or CVV.
const accountSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: {
      type: String,
      required: [true, 'Account name is required'],
      trim: true,
      maxlength: [40, 'Account name cannot exceed 40 characters'],
    },
    type: {
      type: String,
      required: [true, 'Account type is required'],
      enum: { values: TYPES, message: 'Type must be bank, cash, wallet, credit_card or debit_card' },
    },
    openingBalance: { type: Number, default: 0 },
    network: { type: String, enum: { values: NETWORKS, message: 'Unknown card network' } },
    last4: { type: String, match: [/^\d{4}$/, 'Last 4 digits must be exactly 4 numbers'] },
    expiry: { type: String, match: [/^(0[1-9]|1[0-2])\/\d{2}$/, 'Expiry must look like MM/YY'] },
    creditLimit: { type: Number, min: [0, 'Credit limit cannot be negative'] },
    color: { type: String, enum: { values: COLORS, message: 'Unknown color' }, default: 'teal' },
  },
  { timestamps: true }
);

accountSchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Account', accountSchema);
module.exports.CARD_TYPES = CARD_TYPES;
module.exports.TYPES = TYPES;
