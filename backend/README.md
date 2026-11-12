# VELoop Rewards - Wallet Backend

Backend-driven wallet, ledger and payout system (Node.js, Express, MongoDB, Mongoose, JWT).
This README covers the setup for Days 1-5. The full README is completed on Day 12.

## Setup
```bash
cd backend
npm install
cp .env.example .env      # then fill in MONGO_URI and JWT_SECRET
npm run dev
```
Use your OWN MongoDB Atlas cluster (transactions require a replica set).

## Create an admin (needed to test credit/debit)
Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`, then:
```bash
npm run seed:admin
```

## Day 5 manual test sequence (Postman)
Base URL: `http://localhost:5000/api`

| # | Request | Expected |
|---|---------|----------|
| 1 | `POST /auth/register` `{ "name", "email", "password" }` | 201, token returned |
| 2 | `GET /wallet` (Bearer token) | 200, all balances 0 |
| 3 | `GET /wallet` with no token | 401 `Authentication required.` |
| 4 | `POST /wallet/credit` with the USER token | 403 Forbidden |
| 5 | `POST /auth/login` as the admin | 200, admin token |
| 6 | `POST /wallet/credit` (admin) with `"source": "AD_REWARD"` | 400 (admin API only allows admin sources) |
| 7 | `POST /wallet/credit` (admin) `{ "userId", "currency": "VES", "amount": 500, "description": "Test credit" }` | 201, VEs = 500 |
| 8 | `GET /wallet` as the user | VEs = 500 |
| 9 | `GET /wallet/transactions?page=1&limit=20` | ledger with balanceBefore/After |
| 10 | `POST /wallet/debit` (admin) amount 1000 | 400 `Insufficient VEs balance.` |
| 11 | `POST /wallet/debit` (admin) amount 200 | 201, VEs = 300 |
| 12 | `POST /wallet/credit` with `"amount": -5`, `1.5` or `"500"` | 400 validation error |
| 13 | `GET /wallet/transactions?limit=1000` | 400 (limit max 100) |
| 14 | `GET /wallet?userId=someoneElse` | still returns YOUR wallet |

Admin credit/debit only accept `ADMIN_CREDIT` / `CORRECTION_CREDIT` (credit) and `ADMIN_DEBIT` / `CORRECTION` (debit) as `source`.
Reward sources such as `AD_REWARD` are for internal services calling `walletService`, not for the public API.
