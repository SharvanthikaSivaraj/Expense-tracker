# Expense Tracker

A MERN app to record daily income and expenses, sort them into categories, and see a monthly summary with charts.

**Live app:** https://expense-tracker-three-sigma-94.vercel.app &nbsp;|&nbsp; **API:** https://expense-tracker-api-zgkq.onrender.com/api/health

Try it with the demo account: `demo@expensetracker.dev` / `Demo1234` (use the "Use demo" button on the login page).

> The backend runs on a free Render plan, so the first request after a period of inactivity can take about 50 seconds.

![Dashboard](docs/screenshots/dashboard.png)

## Features
- Accounts with login: register, log in, edit profile, change password, delete account (each user sees only their own data)
- Accounts and cards (bank, cash, wallet, credit or debit card) with computed balances and credit utilisation; link transactions to an account
- Plan page: overall and per-category budgets with progress, savings goals with contributions, and bill reminders (mark paid records the expense and rolls monthly bills forward)
- Export the visible transactions to CSV (spreadsheet-safe)
- Add, edit and delete transactions (amount, income or expense, category, date, payment method, optional note)
- View transactions for any month, newest first
- Monthly summary: total income, total expense and balance, computed with MongoDB aggregation
- Doughnut chart of expense by category, and a bar chart of income vs expense
- Client side and server side validation, with a loading spinner, error banner and empty states
- Light and dark themes, search, filters and sorting, monthly budget with progress ring, insights page
- Responsive layout for mobile, tablet and desktop

## Tech stack
| Layer | Technology |
|---|---|
| Database | MongoDB Atlas |
| Backend | Node.js, Express, Mongoose |
| Frontend | React (Vite), Axios, Chart.js |
| Auth | bcrypt password hashing, JWT sessions |
| Hosting | Render (backend), Vercel (frontend) |

## Architecture
```
React (browser)  --Axios/JSON-->  Express API  --Mongoose-->  MongoDB Atlas
   Vercel                           Render                       Cloud
```

## Project structure
```
Expense_tracker/
├── docs/        features, schema and API documentation
├── server/      Express API (models, routes, seed script)
└── client/      React app (api.js, App.jsx, components)
```

## Run it locally

**Prerequisites:** Node.js 18+ and a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster.

### 1. Backend
```bash
cd server
npm install
cp .env.example .env     # then put your Atlas connection string in MONGO_URI
npm run dev              # http://localhost:5001
```

| Variable | Purpose |
|---|---|
| `MONGO_URI` | Atlas connection string, including the database name `expense_tracker` |
| `PORT` | API port (5001, because macOS uses 5000 for AirPlay) |
| `CLIENT_URL` | Allowed CORS origin, `http://localhost:5173` locally |
| `JWT_SECRET` | Long random string used to sign login tokens (`openssl rand -hex 48`) |
| `JWT_EXPIRES_IN` | Token lifetime, `7d` by default |

Optional: create a demo user with sample transactions using `npm run seed` (login `demo@expensetracker.dev` / `Demo1234`). Add `--reset` to clear that user's data first, or `--email you@x.com --claim` to attach to your own account.

### 2. Frontend
```bash
cd client
npm install
npm run dev              # http://localhost:5173
```
The client talks to the Express API and MongoDB. Set `VITE_API_URL` if the API is not at `http://localhost:5001/api`, and `VITE_DEMO_LOGIN=true` to show a "Use demo account" button (run `npm run seed` in `server/` first). For an offline demo that needs no backend, set `VITE_USE_MOCK=true`; data then lives in the browser's storage. See `client/.env.example`.

## API
Base URL: `/api`. All errors return `{ "error": "message" }`. Transaction endpoints require `Authorization: Bearer <token>`.

| Method | Endpoint | Purpose | Success | Errors |
|---|---|---|---|---|
| POST | `/auth/register` | Create account, returns token and user | 201 | 400, 409 |
| POST | `/auth/login` | Log in, returns token and user | 200 | 400, 401 |
| GET | `/auth/me` | Current user | 200 | 401 |
| PUT | `/auth/me` | Update name | 200 | 400, 401 |
| PUT | `/auth/me/password` | Change password | 200 | 400, 401 |
| DELETE | `/auth/me` | Delete account and its data | 200 | 400, 401 |
| GET | `/accounts` | List accounts with computed balances | 200 | 401 |
| POST | `/accounts` | Create account or card (last 4 digits only) | 201 | 400, 409 |
| PUT | `/accounts/:id` | Update account | 200 | 400, 404, 409 |
| DELETE | `/accounts/:id` | Delete account, keep its transactions | 200 | 400, 404 |
| GET, POST, PUT, DELETE | `/budgets` | Overall and per-category monthly budgets | 200/201 | 400, 404, 409 |
| GET, POST, PUT, DELETE | `/goals` | Savings goals; `POST /goals/:id/contribute` adds or withdraws | 200/201 | 400, 404 |
| GET, POST, PUT, DELETE | `/reminders` | Bills; `POST /reminders/:id/pay` records the expense | 200/201 | 400, 404 |

| Method | Endpoint | Purpose | Success | Errors |
|---|---|---|---|---|
| GET | `/transactions?month=2026-10` | List for a month, newest first | 200 | 400, 500 |
| POST | `/transactions` | Create | 201 | 400 |
| PUT | `/transactions/:id` | Update | 200 | 400, 404 |
| DELETE | `/transactions/:id` | Delete | 200 | 400, 404 |
| GET | `/transactions/summary?month=2026-10` | Totals and expense by category | 200 | 400, 500 |

Full request and response examples are in [docs/api.md](docs/api.md).

## Deployment

**Database:** MongoDB Atlas. In Network Access allow `0.0.0.0/0` (Render's IPs are not fixed) and use a strong database user password.

**Backend on Render**
1. New Blueprint (uses `render.yaml`), or a Web Service with root directory `server`, build `npm install`, start `node server.js`.
2. Set `MONGO_URI` (include the database name `expense_tracker`), `JWT_SECRET` (a long random string) and `CLIENT_URL` (the Vercel URL, no trailing slash).
3. Check `https://<service>.onrender.com/api/health` returns `{"status":"ok"}`.

**Frontend on Vercel**
1. Import the repo with root directory `client` (framework: Vite).
2. Environment variable: `VITE_API_URL=https://<service>.onrender.com/api` (optionally `VITE_DEMO_LOGIN=true` after running the seed against the production database).
3. Redeploy after changing variables (they are baked in at build time).
4. Put the Vercel URL into `CLIENT_URL` on Render so CORS only allows your site.

Set `VITE_USE_MOCK=true` instead to deploy a backend-free demo that keeps data in each visitor's browser.

## Design decisions
- **Amounts are always positive.** `type` decides whether it adds to or subtracts from the balance.
- **Dates are stored in UTC**, so month boundaries are the same on every server and timezone.
- **Totals are never stored.** They are computed with an aggregation pipeline (`$match`, `$group`, `$sort`), so they cannot go out of sync after an edit or delete.
- **`/summary` is defined before `/:id`** so Express does not treat "summary" as an id.
- **`runValidators: true` on updates**, because Mongoose skips schema validation on updates by default.
- **Data is scoped by user.** Every query includes the owner, and request bodies are whitelisted so a client can never set `user`.
- **Email checks on sign-up:** syntax, real suffix from the IANA list, common typos with a one-click fix, and a DNS lookup that the domain exists.
- **Login hardening:** bcrypt hashing, identical errors for unknown email and wrong password, rate limiting on auth routes, input type checks against NoSQL operator injection, `helmet` headers.

## Documentation
- [Features](docs/features.md)
- [Database schema](docs/schema.md)
- [API contract](docs/api.md)

## Out of scope
Multiple currencies, recurring transactions and CSV export.
