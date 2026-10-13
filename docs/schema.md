# Database Schema

Collection: `transactions`

| Field | Type | Rules |
|---|---|---|
| amount | Number | required, min 0.01 |
| type | String | required, enum: income, expense |
| category | String | required, trimmed |
| date | Date | required, stored in UTC |
| paymentMethod | String | required, enum: cash, card, upi, bank |
| note | String | optional, max 200 chars |
| createdAt | Date | auto (timestamps) |
| updatedAt | Date | auto (timestamps) |

## Example document
```json
{
  "_id": "665f1c2e8a1b2c3d4e5f6a7b",
  "amount": 450,
  "type": "expense",
  "category": "Food",
  "date": "2026-10-12T00:00:00.000Z",
  "paymentMethod": "upi",
  "note": "Lunch with friends",
  "createdAt": "2026-10-12T09:15:00.000Z",
  "updatedAt": "2026-10-12T09:15:00.000Z"
}
```

## Design decisions
- Amounts are always positive; `type` decides the sign in calculations.
- Dates are stored in UTC to avoid timezone bugs in month filtering.
- Monthly totals are computed with MongoDB aggregation, not stored.
