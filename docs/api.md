# API Contract

Base URL (local): http://localhost:5001/api

Transaction endpoints require `Authorization: Bearer <token>` (from `/auth/register` or `/auth/login`).
A missing or invalid token returns 401.

All requests and responses use JSON. All errors use this shape:

    { "error": "message here" }

---

## Auth

| Method | Endpoint | Body | Success | Errors |
|---|---|---|---|---|
| POST | `/api/auth/register` | `{ name, email, password }` | 201 `{ token, user }` | 400 validation, 409 email exists |
| POST | `/api/auth/login` | `{ email, password }` | 200 `{ token, user }` | 400, 401 invalid email or password |
| GET | `/api/auth/me` | | 200 `user` | 401 |
| PUT | `/api/auth/me` | `{ name }` | 200 `user` | 400, 401 |
| PUT | `/api/auth/me/password` | `{ currentPassword, newPassword }` | 200 `{ message }` | 400, 401 |
| DELETE | `/api/auth/me` | `{ password }` | 200 `{ message }` | 400, 401 |

Passwords: 8 to 72 characters with at least one letter and one number.

---

## Accounts

Banks, cash, wallets and cards. Requires a token. Balances are computed, never stored:
`balance = openingBalance + income - expense` of the transactions linked to the account.

| Method | Endpoint | Purpose | Success | Errors |
|---|---|---|---|---|
| GET | `/api/accounts` | List with `balance`, `income`, `expense`, `transactionCount` | 200 | 401 |
| POST | `/api/accounts` | Create | 201 | 400, 409 name exists |
| PUT | `/api/accounts/:id` | Update | 200 | 400, 404, 409 |
| DELETE | `/api/accounts/:id` | Delete, keeps its transactions (unlinked) | 200 `{ message, unlinked }` | 400, 404 |

Body fields: `name` (max 40), `type` (`bank`, `cash`, `wallet`, `credit_card`, `debit_card`),
`openingBalance`, `color` (`teal`, `indigo`, `amber`, `rose`, `slate`).
Cards only: `network` (`visa`, `mastercard`, `rupay`, `amex`, `other`), `last4` (4 digits), `expiry` (`MM/YY`),
and for credit cards `creditLimit`. Full card numbers and CVV are never stored; fields that do not apply
to the type are dropped.

Transactions accept an optional `account` id (or `null`). `GET /api/transactions?account=<id>` filters by account.

---

## 1. GET /api/transactions?month=2026-10
List transactions for a month, newest first. If `month` is omitted, returns all.

Success 200:

    [
      {
        "_id": "665f1c2e8a1b2c3d4e5f6a7b",
        "amount": 450,
        "type": "expense",
        "category": "Food",
        "date": "2026-10-12T00:00:00.000Z",
        "paymentMethod": "upi",
        "note": "Lunch"
      }
    ]

Errors: 400 invalid month format, 500 server error

---

## 2. POST /api/transactions
Create a transaction.

Request body:

    {
      "amount": 450,
      "type": "expense",
      "category": "Food",
      "date": "2026-10-12",
      "paymentMethod": "upi",
      "note": "Lunch"
    }

Success 201: the created transaction (same shape as above)
Errors: 400 validation failed

---

## 3. PUT /api/transactions/:id
Update a transaction. Body has the same fields as POST.

Success 200: the updated transaction
Errors: 400 validation failed or invalid id, 404 not found

---

## 4. DELETE /api/transactions/:id
Delete a transaction.

Success 200:

    { "message": "Deleted" }

Errors: 400 invalid id, 404 not found

---

## 5. GET /api/transactions/summary?month=2026-10
Monthly totals computed with MongoDB aggregation. `month` is required.

Success 200:

    {
      "income": 50000,
      "expense": 12300,
      "balance": 37700,
      "byCategory": [
        { "_id": "Rent", "total": 8000 },
        { "_id": "Food", "total": 3000 }
      ]
    }

Errors: 400 missing or invalid month, 500 server error

---

## Status codes used
| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Bad request (validation or bad id or bad month) |
| 404 | Transaction not found |
| 500 | Server error |

## Notes
- `byCategory` only includes expenses, sorted highest first.
- `/summary` must be defined before `/:id` in Express routes.
