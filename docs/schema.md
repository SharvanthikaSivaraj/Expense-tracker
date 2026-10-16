# Database schema

## User
| Field | Type | Notes |
|---|---|---|
| name | String | 2 to 50 characters |
| email | String | unique, lowercase |
| passwordHash | String | bcrypt hash, never sent to the client |
| budget | Number | monthly spending limit, 0 = not set |

## Transaction
| Field | Type | Notes |
|---|---|---|
| user | ObjectId | owner; every query filters on it |
| amount | Number | always positive, at least 0.01 |
| type | String | `income` or `expense` |
| category | String | e.g. Food, Rent, Salary |
| date | Date | stored in UTC |
| paymentMethod | String | `cash`, `card`, `upi` or `bank` |
| note | String | optional, up to 200 characters |
