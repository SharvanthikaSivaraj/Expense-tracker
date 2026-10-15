// Creates (or reuses) a demo user and adds demo transactions for the current and previous month.
//   npm run seed                      add demo data to the demo user
//   npm run seed -- --reset           delete that user's transactions first
//   npm run seed -- --email you@x.com --password 'YourPass1' --name 'You'
//   npm run seed -- --claim           also assign old transactions that have no owner to this user
require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');
const User = require('./models/User');

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};

const email = option('email', 'demo@expensetracker.dev').toLowerCase();
const password = option('password', 'Demo1234');
const name = option('name', 'Demo User');

const now = new Date();
const thisMonth = { y: now.getUTCFullYear(), m: now.getUTCMonth() };
const prevMonth = thisMonth.m === 0 ? { y: thisMonth.y - 1, m: 11 } : { y: thisMonth.y, m: thisMonth.m - 1 };
const day = ({ y, m }, d) => new Date(Date.UTC(y, m, d));

const rows = (month, user) =>
  [
    [50000, 'income', 'Salary', 1, 'bank', 'Monthly salary'],
    [8000, 'expense', 'Rent', 2, 'bank', 'Room rent'],
    [450, 'expense', 'Food', 4, 'upi', 'Lunch with friends'],
    [1200, 'expense', 'Bills', 6, 'upi', 'Electricity and internet'],
    [300, 'expense', 'Transport', 8, 'cash', 'Metro card recharge'],
    [2500, 'expense', 'Shopping', 11, 'card', 'New shoes'],
    [5000, 'income', 'Freelance', 13, 'upi', 'Website project'],
    [600, 'expense', 'Entertainment', 15, 'card', 'Movie and snacks'],
    [350, 'expense', 'Health', 18, 'cash', 'Pharmacy'],
    [900, 'expense', 'Food', 21, 'upi', 'Groceries'],
  ].map(([amount, type, category, d, paymentMethod, note]) => ({
    user, amount, type, category, paymentMethod, note, date: day(month, d),
  }));

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 10) });
    console.log(`Created user ${email} (password: ${password})`);
  } else {
    console.log(`Using existing user ${email}`);
  }

  if (flag('reset')) {
    const { deletedCount } = await Transaction.deleteMany({ user: user._id });
    console.log(`Deleted ${deletedCount} existing transactions for this user`);
  }

  if (flag('claim')) {
    const { modifiedCount } = await Transaction.updateMany(
      { user: { $exists: false } },
      { $set: { user: user._id } }
    );
    console.log(`Assigned ${modifiedCount} ownerless transactions to this user`);
  }

  const docs = [...rows(prevMonth, user._id), ...rows(thisMonth, user._id)];
  await Transaction.insertMany(docs);
  console.log(`Inserted ${docs.length} demo transactions`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
