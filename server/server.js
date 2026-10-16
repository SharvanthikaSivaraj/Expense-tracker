require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const budgetRoutes = require('./routes/budget');
const transactionRoutes = require('./routes/transactions');

if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  console.error('MONGO_URI and JWT_SECRET must be set in .env');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1); // correct client IPs behind Render's proxy (rate limiting)
app.use(helmet());

// CLIENT_URL may hold several comma-separated origins. Values pasted from a browser can carry
// invisible characters or a trailing slash, so keep only printable ASCII and drop the slash.
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.replace(/[^\x21-\x7E]/g, '').replace(/\/+$/, ''))
  .filter(Boolean);

app.use(
  cors({
    // No Origin header (health checks, curl, server to server) is always fine.
    // Unknown origins get no CORS headers, so the browser blocks them.
    origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)),
  })
);
app.use(express.json({ limit: '10kb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/transactions', transactionRoutes);

// Malformed JSON body and anything unhandled
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body' });
  res.status(500).json({ error: 'Server error' });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    console.log(`CORS allows: ${allowedOrigins.join(', ')}`);
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
