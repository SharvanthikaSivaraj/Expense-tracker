const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: {
      type: String,
      required: [true, 'Goal name is required'],
      trim: true,
      maxlength: [60, 'Goal name cannot exceed 60 characters'],
    },
    target: { type: Number, required: [true, 'Target is required'], min: [1, 'Target must be at least 1'] },
    saved: { type: Number, default: 0, min: [0, 'Saved amount cannot be negative'] },
    deadline: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Goal', goalSchema);
