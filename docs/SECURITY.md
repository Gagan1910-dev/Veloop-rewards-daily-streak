# Security & Anti-Cheat Architecture

This document details the security principles, cryptographic safeguards, anti-tamper validations, and concurrency protections implemented across the VELoop Rewards system.

---

## 1. Authentication & Identity Protection

### 1.1. Cryptographic JWTs
* Authentication tokens are signed using HMAC-SHA256 with a server-side `JWT_SECRET`.
* Tokens include only necessary identity claims (`id`, `email`, `role`) with configurable expiration (`JWT_EXPIRES_IN=7d`).

### 1.2. Zero Client Authority
* Authenticated handlers extract user identity strictly from `req.user.id` injected by [`auth.middleware.js`](file:///d:/Veloop%20Task/backend/src/middleware/auth.middleware.js).
* Any client-provided `userId` in request bodies, query strings, or headers is discarded, preventing cross-user impersonation.

### 1.3. Credential Security
* User passwords are salted and hashed with **bcrypt** (10 rounds) before persistence.
* Cleartext passwords or password hashes are excluded from all query outputs and API response payloads (`select('-password')`).

---

## 2. Server-Authoritative Streak & Anti-Cheat

### 2.1. Server Time Authority
* All eligibility determinations, cooldown checks, and missed streak evaluations rely strictly on trusted backend timestamps (`serverTime`, `nextClaimAt`).
* Tampering with client PC/phone system clocks has **zero effect** on claim eligibility.

### 2.2. Zero Client Reward Parameters
* The claim endpoint (`POST /api/daily-streak/claim`) accepts an empty request body `{}`.
* Injected payloads such as `{ "day": 7, "reward": 1000000, "currency": "USD" }` are ignored. The backend retrieves the authentic configured reward from `StreakReward` based on the user's active cycle state.

### 2.3. Sequential Claim & Previous-Day Validation
* Day $N$ can only be claimed if Day $N-1$ was successfully claimed in the current active cycle. Day skipping is rejected.

### 2.4. Atomic Concurrency & Idempotency Protection
* **Atomic State Locking**: The backend uses atomic conditional updates (`findOneAndUpdate({ _id: cycle._id, lastClaimedDay: targetDay - 1, status: 'ACTIVE' })`) to transition streak days.
* **Unique Compound Constraint**: The `StreakClaim` collection enforces a unique compound index on `{ userId: 1, cycleId: 1, day: 1 }`.
* **Race Condition Defense**: Tested with 5 simultaneous requests: exactly 1 succeeds, and 4 are rejected (`409 Conflict`), crediting the wallet strictly once.

### 2.5. Missed-Streak Reset
* If the user fails to check in before `claimWindowExpiresAt`, the backend marks the cycle `RESET` and begins a new active cycle at Day 1 upon their next interaction.

---

## 3. Financial Ledger Integrity & Audit Logging

* **Transaction Ledger**: Every successful claim creates an immutable `WalletTransaction` recording `transactionId`, `userId`, `amount`, `currency`, `streakDay`, `referenceId`, `balanceBefore`, and `balanceAfter`.
* **Security Audit Trail**: All security-relevant events (`STREAK_CLAIM_REQUEST`, `STREAK_CLAIM_SUCCESS`, `STREAK_CLAIM_REJECTED`, `STREAK_RESET`, `DUPLICATE_CLAIM`, `INVALID_CLAIM`) are recorded in the `AuditLog` collection.
* **Error Sanitization**: Errors are sanitized via centralized middleware and `sanitizeApiError`, preventing raw MongoDB, Mongoose, or stack trace exposure.
