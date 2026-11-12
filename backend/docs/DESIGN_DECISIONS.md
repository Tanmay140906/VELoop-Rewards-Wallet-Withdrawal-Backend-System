# Design Decisions (Day 1)

## Withdrawal strategy: Option A
VEs are **deducted immediately** when a withdrawal is created. If an admin rejects
the withdrawal, the VEs are **refunded** with a new ledger `CREDIT` entry
(`source: WITHDRAWAL_REFUND`). A refund can happen only once per withdrawal.

## Money rules
- All balances and amounts are **integers** (never floats).
- Balances can never go below 0 (enforced by the atomic debit filter and the schema).
- The server is the only source of truth. The client never sends `amount`, `balance` or a payout value.

## Ledger
- One `WalletTransaction` per balance change, with `balanceBefore` and `balanceAfter`.
- `type` = direction (`CREDIT` / `DEBIT`). `source` = reason (`AD_REWARD`, `WITHDRAWAL`, ...).
- **Append-only**: no updates or deletes. A mistake is fixed with a new `CORRECTION` entry.
- Added sources beyond the PDF list: `WITHDRAWAL_REFUND`, `CORRECTION_CREDIT`.

## Atomicity
- Debit = one conditional update: "subtract only if balance >= amount".
- Balance change + ledger entry (+ audit log for admin actions) run in **one MongoDB transaction**.
- Transactions need a replica set, so development uses MongoDB Atlas.

## Idempotency (Day 7)
Client sends an `Idempotency-Key` header. Unique index on `{ userId, idempotencyKey }`
in the Withdrawal collection. A replayed key returns the original result.

## Auth
- JWT carries only the user id. Role and account status are re-read from the database on every request.
- Admins are created only through `npm run seed:admin`, never through `/register`.
- Users can only ever access their own wallet: the id comes from the token, never from the request.

## Audit
Admin credit/debit/correction writes the audit log inside the same transaction as the wallet change.
