# API Contract

Base URL (local): http://localhost:5000/api

All requests and responses use JSON. All errors use this shape:

    { "error": "message here" }

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
