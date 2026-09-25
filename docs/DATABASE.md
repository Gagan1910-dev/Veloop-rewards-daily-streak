# Database Architecture & Data Models

This document outlines the MongoDB schemas, data models, relational mappings, indexes, and concurrency constraints implemented for the VELoop Rewards system.

---

## 1. Mongoose Models Specification

### 1.1. `User` (`backend/src/models/User.js`)
* **Purpose**: Core authentication identity and user profile.
* **Fields**:
  * `name`: String (required, minlength 2)
  * `email`: String (required, unique, lowercase, trimmed)
  * `password`: String (bcrypt hashed)
  * `role`: String (`'user' | 'admin'`, default: `'user'`)
  * `isActive`: Boolean (default: `true`)
  * `timestamps`: `createdAt`, `updatedAt`
* **Indexes**: `{ email: 1 }` (unique)

---

### 1.2. `Wallet` (`backend/src/models/Wallet.js`)
* **Purpose**: Real backend balance ledger for the user.
* **Fields**:
  * `userId`: ObjectId (ref `User`, required, unique)
  * `vesBalance`: Number (default: `0`, min: `0`)
  * `gemsBalance`: Number (default: `0`, min: `0`)
  * `giftCardBalanceINR`: Number (default: `0`, min: `0`)
  * `currency`: String (default: `'VES'`)
  * `lastUpdated`: Date
  * `timestamps`: `createdAt`, `updatedAt`
* **Indexes**: `{ userId: 1 }` (unique)

---

### 1.3. `StreakReward` (`backend/src/models/StreakReward.js`)
* **Purpose**: Backend-driven configuration for 7-day streak rewards.
* **Fields**:
  * `day`: Number (1 to 7, required, unique)
  * `rewardType`: String (`'VES' | 'GIFT_CARD' | 'COIN' | 'VIP' | 'CROWN' | 'CUSTOM'`)
  * `currency`: String (`'VES' | 'INR' | 'USD' | 'GEMS'`, default: `'VES'`)
  * `amount`: Number (required, min: 0)
  * `title`: String (`"+5"`, `"+10"`, `"₹1"`, etc.)
  * `subtitle`: String (`"5 VEs"`, `"Amazon Gift Card"`, etc.)
  * `description`: String
  * `asset`: String (`'coin' | 'gift-box' | 'gift-card' | 'crown' | 'coins-stack'`)
  * `active`: Boolean (default: `true`)
  * `metadata`: Object (`badge`, `isUltimate`, `brand`, `displayIcon`)
* **Indexes**: `{ day: 1, active: 1 }`

---

### 1.4. `StreakCycle` (`backend/src/models/StreakCycle.js`)
* **Purpose**: Tracks active 7-day cycles and streak progression.
* **Fields**:
  * `cycleId`: String (unique UUID/Identifier)
  * `userId`: ObjectId (ref `User`, required)
  * `cycleNumber`: Number (default: 1)
  * `status`: String (`'ACTIVE' | 'COMPLETED' | 'RESET' | 'ABANDONED'`, default: `'ACTIVE'`)
  * `currentStreak`: Number (0 to 7)
  * `lastClaimedDay`: Number (0 to 7)
  * `lastClaimedAt`: Date
  * `nextEligibleClaimAt`: Date (authoritative unlock timestamp)
  * `claimWindowExpiresAt`: Date (missed streak detection threshold)
  * `completedAt`: Date
* **Compound & Partial Indexes**:
  * `{ userId: 1, status: 1 }` with `name: 'uniq_user_active_cycle'`, `unique: true`, `partialFilterExpression: { status: 'ACTIVE' }` (Guarantees strictly ONE active cycle per user)
  * `{ userId: 1, cycleNumber: -1 }`

---

### 1.5. `StreakClaim` (`backend/src/models/StreakClaim.js`)
* **Purpose**: Immutable ledger of check-ins and claims.
* **Fields**:
  * `claimId`: String (unique UUID)
  * `userId`: ObjectId (ref `User`, required)
  * `cycleId`: String (required)
  * `day`: Number (1 to 7)
  * `rewardId`: ObjectId (ref `StreakReward`)
  * `rewardSnapshot`: `{ rewardType, currency, amount, title }`
  * `status`: String (`'CLAIMED' | 'PENDING' | 'REJECTED' | 'FAILED'`, default: `'CLAIMED'`)
  * `claimedAt`: Date (default: `Date.now`)
  * `transactionId`: String (ref `WalletTransaction`)
* **Unique Compound Constraint**:
  * `{ userId: 1, cycleId: 1, day: 1 }` (**Enforces database-level idempotency & zero duplicate claims**)

---

### 1.6. `WalletTransaction` (`backend/src/models/WalletTransaction.js`)
* **Purpose**: Backend-controlled wallet transaction ledger with balanceBefore/balanceAfter and unique transaction references.
* **Fields**:
  * `transactionId`: String (unique UUID)
  * `userId`: ObjectId (ref `User`, required)
  * `currency`: String (`'VES' | 'INR' | 'USD' | 'GEMS'`)
  * `type`: String (`'CREDIT' | 'DEBIT'`, default: `'CREDIT'`)
  * `amount`: Number
  * `source`: String (`'DAILY_STREAK' | 'REFERRAL' | 'PROMO' | 'REWARD_REDEMPTION'`)
  * `streakDay`: Number (1 to 7)
  * `referenceId`: String (e.g., `STREAK-1-xxxx`)
  * `balanceBefore`: Number
  * `balanceAfter`: Number
  * `status`: String (`'SUCCESS' | 'PENDING' | 'FAILED' | 'REVERSED'`, default: `'SUCCESS'`)
* **Indexes**:
  * `{ userId: 1, createdAt: -1 }`
  * `{ referenceId: 1 }`

---

### 1.7. `AuditLog` (`backend/src/models/AuditLog.js`)
* **Purpose**: Compliance and fraud detection event trail.
* **Fields**:
  * `userId`: ObjectId (ref `User`, optional)
  * `event`: String (`STREAK_CLAIM_REQUEST`, `STREAK_CLAIM_SUCCESS`, `STREAK_CLAIM_REJECTED`, `STREAK_RESET`, `DUPLICATE_CLAIM`, `INVALID_CLAIM`, `UNAUTHORIZED_ACCESS`, `TIME_MANIPULATION_ATTEMPT`)
  * `status`: String (`'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS' | 'REJECTED'`)
  * `details`: Mixed Object
  * `ipAddress`: String
  * `userAgent`: String
* **Indexes**:
  * `{ event: 1, createdAt: -1 }`
  * `{ userId: 1, createdAt: -1 }`
