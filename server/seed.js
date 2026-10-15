// Creates (or reuses) a demo user and fills it with sample data:
// accounts and cards, transactions linked to them, budgets, goals and bills.
//   npm run seed                      refresh the demo user (demo@expensetracker.dev / Demo1234)
//   npm run seed -- --email you@x.com --password 'YourPass1' --name 'You' --reset
//                                     seed your own account (needs --reset to replace its data)
//   npm run seed -- --claim           also assign old transactions that have no owner to this user
require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Account = require('./models/Account');
const Budget = require('./models/Budget');
const Goal = require('./models/Goal');
const Reminder = require('./models/Reminder');
const Transaction = require('./models/Transaction');
const User = require('./models/User');

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};

const DEMO_EMAIL = 'demo@expensetracker.dev';
const email = option('email', DEMO_EMAIL).toLowerCase();
const password = option('password', 'Demo1234');
const name = option('name', 'Demo User');
// The demo user is disposable, so it is always refreshed. Real accounts only with --reset.
const reset = flag('reset') || email === DEMO_EMAIL;

const now = new Date();
const thisMonth = { y: now.getUTCFullYear(), m: now.getUTCMonth() };
const prevMonth = thisMonth.m === 0 ? { y: thisMonth.y - 1, m: 11 } : { y: thisMonth.y, m: thisMonth.m - 1 };
const monthDay = ({ y, m }, d) => new Date(Date.UTC(y, m, d));
const fromToday = (offset) =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offset));

const TRANSACTIONS = [
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
];

// payment method -> demo account
const ACCOUNT_FOR = { bank: 'HDFC Savings', upi: 'HDFC Savings', cash: 'Cash wallet', card: 'ICICI Credit Card' };

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 10) });
    console.log(`Created user ${email} (password: ${password})`);
  } else {
    console.log(`Using existing user ${email}`);
  }
  const owner = user._id;

  if (reset) {
    const [t, a, b, g, r] = await Promise.all([
      Transaction.deleteMany({ user: owner }),
      Account.deleteMany({ user: owner }),
      Budget.deleteMany({ user: owner }),
      Goal.deleteMany({ user: owner }),
      Reminder.deleteMany({ user: owner }),
    ]);
    console.log(
      `Cleared ${t.deletedCount} transactions, ${a.deletedCount} accounts, ${b.deletedCount} budgets, ${g.deletedCount} goals, ${r.deletedCount} bills`
    );
  }

  if (flag('claim')) {
    const { modifiedCount } = await Transaction.updateMany({ user: { $exists: false } }, { $set: { user: owner } });
    console.log(`Assigned ${modifiedCount} ownerless transactions to this user`);
  }

  const accounts = await Account.insertMany([
    { user: owner, name: 'HDFC Savings', type: 'bank', openingBalance: 25000, color: 'teal' },
    { user: owner, name: 'Cash wallet', type: 'cash', openingBalance: 2000, color: 'amber' },
    {
      user: owner,
      name: 'ICICI Credit Card',
      type: 'credit_card',
      network: 'visa',
      last4: '4242',
      expiry: '08/29',
      creditLimit: 100000,
      openingBalance: 0,
      color: 'indigo',
    },
    {
      user: owner,
      name: 'Axis Debit Card',
      type: 'debit_card',
      network: 'mastercard',
      last4: '1881',
      expiry: '03/28',
      openingBalance: 5000,
      color: 'slate',
    },
  ]);
  const accountId = Object.fromEntries(accounts.map((a) => [a.name, a._id]));

  const transactions = [prevMonth, thisMonth].flatMap((month) =>
    TRANSACTIONS.map(([amount, type, category, day, paymentMethod, note]) => ({
      user: owner,
      amount,
      type,
      category,
      paymentMethod,
      note,
      date: monthDay(month, day),
      account: accountId[ACCOUNT_FOR[paymentMethod]] || null,
    }))
  );
  await Transaction.insertMany(transactions);

  await Budget.insertMany([
    { user: owner, category: 'ALL', limit: 30000 },
    { user: owner, category: 'Food', limit: 4000 },
    { user: owner, category: 'Shopping', limit: 3000 },
    { user: owner, category: 'Entertainment', limit: 1500 },
  ]);

  await Goal.insertMany([
    { user: owner, name: 'Goa trip', target: 60000, saved: 22000, deadline: fromToday(150) },
    { user: owner, name: 'Emergency fund', target: 100000, saved: 45000 },
  ]);

  await Reminder.insertMany([
    { user: owner, title: 'Phone bill', amount: 599, dueDate: fromToday(-3), repeat: 'monthly', category: 'Bills' },
    { user: owner, title: 'Electricity bill', amount: 1200, dueDate: fromToday(5), repeat: 'monthly', category: 'Bills' },
    { user: owner, title: 'Netflix', amount: 649, dueDate: fromToday(11), repeat: 'monthly', category: 'Entertainment' },
    { user: owner, title: 'Insurance premium', amount: 4500, dueDate: fromToday(24), repeat: 'none', category: 'Health' },
  ]);

  console.log(
    `Seeded ${accounts.length} accounts, ${transactions.length} transactions, 4 budgets, 2 goals, 4 bills for ${email}`
  );
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
