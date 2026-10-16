# API

All routes except register and login need the header `Authorization: Bearer <token>`.
Errors are returned as `{ "error": "message" }`.

| Method | Path | Body or query | Returns |
|---|---|---|---|
| POST | /api/auth/register | name, email, password | `{ token, user }` |
| POST | /api/auth/login | email, password | `{ token, user }` |
| GET | /api/auth/me | | user |
| GET | /api/budget | | `{ limit }` |
| PUT | /api/budget | limit | `{ limit }` |
| GET | /api/transactions?month=YYYY-MM | | list, newest first |
| GET | /api/transactions/summary?month=YYYY-MM | | `{ income, expense, balance, byCategory }` |
| POST | /api/transactions | amount, type, category, date, paymentMethod, note | created transaction |
| PUT | /api/transactions/:id | same fields | updated transaction |
| DELETE | /api/transactions/:id | | `{ message }` |
