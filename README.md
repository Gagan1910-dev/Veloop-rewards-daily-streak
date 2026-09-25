# VELoop Rewards — Daily Streak & Rewards System

A production-grade, full-stack **MERN** (MongoDB, Express.js, React.js, Node.js) implementation of the **VELoop Rewards Daily Streak System**, featuring a server-authoritative streak engine, zero-trust anti-cheat safeguards, atomic concurrency locking, and pixel-perfect responsive UI built with Bootstrap and CSS Modules.

---

## 🏛 Core Architectural Principle
> **The frontend must NEVER be the source of truth.**
> All streak counts, claim eligibility, reward configurations, countdown timers, missed-day resets, wallet updates, and ledger transactions are calculated, validated, and enforced exclusively by the backend API.

```text
 ┌─────────────────────────────────────────────────────────┐
 │                   AUTHENTICATED USER                    │
 └────────────────────────────┬────────────────────────────┘
                              │ Bearer JWT / User Action
                              ▼
 ┌─────────────────────────────────────────────────────────┐
 │             REACT FRONTEND (Vite + CSS Modules)         │
 └────────────────────────────┬────────────────────────────┘
                              │ REST API (Axios Interceptors)
                              ▼
 ┌─────────────────────────────────────────────────────────┐
 │             EXPRESS.JS REST API (Node.js)               │
 └────────────────────────────┬────────────────────────────┘
                              │ Mongoose ORM
                              ▼
 ┌─────────────────────────────────────────────────────────┐
 │                    MONGODB DATABASE                     │
 │  ┌──────────────┬──────────────────┬─────────────────┐  │
 │  │ StreakState  │  RewardsConfig   │  WalletLedger   │  │
 │  └──────────────┴──────────────────┴─────────────────┘  │
 └────────────────────────────┬────────────────────────────┘
                              │
            ┌─────────────────┴─────────────────┐
            ▼                                   ▼
 ┌──────────────────────┐             ┌──────────────────┐
 │  SERVER VALIDATION   │             │   ATOMIC LOCK    │
 └──────────┬───────────┘             └─────────┬────────┘
            │                                   │
            ▼                                   ▼
 ┌──────────────────────┐             ┌──────────────────┐
 │    CLAIM SUCCESS     │             │ REWARD LEDGER TX │
 └──────────┬───────────┘             └─────────┬────────┘
            │                                   │
            ▼                                   ▼
 ┌──────────────────────┐             ┌──────────────────┐
 │   CPA DEMO MODAL     │             │ 24h SERVER TIMER │
 └──────────────────────┘             └──────────────────┘
```

---

## ✨ Key Features

1. **7-Day Dynamic Streak Progression**:
   * **Day 1**: `+5 VEs` (Coin Asset)
   * **Day 2**: `+10 VEs` (Coin Asset, "Today" Gold Badge)
   * **Day 3**: `+15 VEs` (Coin Asset)
   * **Day 4**: `₹1 Amazon Gift Card` (Gift Box Asset)
   * **Day 5**: `₹2 Amazon Gift Card` (Gift Card Asset, "Gift Card" Badge)
   * **Day 6**: `+30 VEs` (Coin Asset, "Coin" Badge)
   * **Day 7**: `₹5 Amazon Gift Card` (Golden Crown Asset, "VIP" Badge, Ultimate Reward)
2. **Server-Authoritative Anti-Cheat Guards**:
   * Zero-payload claim endpoint (`POST /api/daily-streak/claim` with `{}`).
   * Injected fake rewards, days, currencies, or user IDs are completely ignored.
   * Sequential validation prevents day-skipping (Day $N$ requires Day $N-1$).
   * Local device clock tampering has zero effect on server eligibility.
3. **Atomic Concurrency & Idempotency**:
   * Database-level unique compound index (`userId + cycleId + day`) and atomic cycle locking guarantee that concurrent multi-tab or double-click requests are safely rejected (`409 Conflict`).
4. **Missed-Day Streak Reset**:
   * Server evaluates check-in timestamps; if the claim window expires, the cycle automatically resets to Day 1.
5. **CPA Reward Verification Interstitial Modal**:
   * Polished VELoop-themed verification demonstration (`Preparing your reward...` $\rightarrow$ `Reward Verification...` $\rightarrow$ `Verification completed...` $\rightarrow$ `Claiming...`).
6. **Financial Ledger & Audit Trail**:
   * Double-entry `WalletTransaction` records (`balanceBefore`, `balanceAfter`, `referenceId`).
   * Compliance tracking via `AuditLog` for all claim requests, successes, rejections, and resets.
7. **Pixel-Perfect Responsive UI**:
   * Built with dark theme tokens (`#0a0a14`), royal purple cards, gold highlights, and green success states.
   * Responsive across Mobile (320px–480px), Tablet (768px–1024px), and Desktop (1280px–1920px+).

---

## 📁 Repository Structure

```text
veloop-daily-streak/
├── frontend/                                 # Vite + React 19 Client
│   ├── public/assets/daily-streak/           # 12 Official Google Drive design assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── StreakHeader/                 # Navbar, Flame indicator & wallet balance
│   │   │   ├── HeroBanner/                   # Hero section with dual desktop/mobile artwork
│   │   │   ├── StreakStats/                  # Streak badge, Total Rewards, Checked In, Next Reward
│   │   │   ├── UltimateReward/               # Day 7 Crown banner & Amazon Gift Card tag
│   │   │   ├── RewardGrid/                   # 7-Day reward card grid (4 top, 3 bottom)
│   │   │   ├── RewardCard/                   # Reusable card with CLAIMED/AVAILABLE/LOCKED states
│   │   │   ├── ClaimModal/                   # Multi-stage claim lifecycle modal
│   │   │   ├── CpaDemo/                      # Reward verification progress animation
│   │   │   ├── WhyStreak/                    # 4-pillar benefits (Stay Active, Bigger Streak, etc.)
│   │   │   ├── TrustFooter/                  # VeloopRewards.in official trust footer
│   │   │   ├── StreakLoader/                 # Branded glowing loader
│   │   │   └── StreakSkeleton/               # Shimmering dark violet skeleton state
│   │   ├── context/                          # AuthContext (JWT session & live wallet)
│   │   ├── hooks/                            # useCountdown & useAuth
│   │   ├── pages/DailyStreak/                # DailyStreakPage & DailyStreak.module.css
│   │   ├── services/                         # apiClient, authApi, streakApi (Axios)
│   │   └── utils/                            # errorHandler (Sanitizes raw errors)
│   ├── .env.example
│   └── package.json
│
├── backend/                                  # Node.js + Express + Mongoose REST API
│   ├── src/
│   │   ├── config/                           # MongoDB database connector (db.js)
│   │   ├── controllers/                      # auth.controller.js, streak.controller.js
│   │   ├── middleware/                       # auth.middleware.js (JWT Bearer validator)
│   │   ├── models/                           # User, Wallet, StreakReward, StreakCycle,
│   │   │                                     # StreakClaim, WalletTransaction, AuditLog
│   │   ├── routes/                           # auth.routes.js, streak.routes.js
│   │   ├── seed/                             # seedRewards.js (7-Day reward seeder)
│   │   ├── services/                         # auth.service.js, streak.service.js
│   │   ├── tests/                            # auth.test.js, streak.test.js, e2e_full_audit.test.js
│   │   ├── utils/                            # token.util.js
│   │   ├── validators/                       # auth.validator.js
│   │   ├── app.js                            # Express app configuration & middleware
│   │   └── server.js                         # Server entrypoint
│   ├── .env.example
│   └── package.json
│
├── docs/                                     # Technical Documentation
│   ├── API_DOCUMENTATION.md                  # REST API contract & error schemas
│   ├── DATABASE.md                           # Schemas, indexes & relational design
│   ├── SECURITY.md                           # Zero-trust authority & anti-cheat rules
│   └── TESTING.md                            # Comprehensive 30-test execution matrix
│
├── postman/                                  # Postman Collections & Environments
│   ├── VELOOP_Rewards_API.postman_collection.json
│   ├── VELOOP_Local.postman_environment.json
│   └── README.md
│
├── .gitignore
└── README.md
```

---

## 🛠 Technology Stack

* **Frontend**: React 19, Vite, Bootstrap 5, CSS Modules, Lucide React, Framer Motion, Axios
* **Backend**: Node.js, Express.js 5, MongoDB, Mongoose 9, JWT (`jsonwebtoken`), `bcryptjs`, `helmet`, `cors`, `morgan`, `dotenv`
* **Database**: MongoDB Atlas / Local MongoDB
* **Testing**: Automated Node HTTP test runner suites

---

## 🚦 Getting Started

### 1. Prerequisites
* **Node.js** (v18.x or higher)
* **MongoDB** (Local instance or MongoDB Atlas connection string)

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```
Edit `backend/.env` with your settings:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/veloop_streak?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=7d
```
Seed the 7 reward configurations and start the server:
```bash
npm run seed
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧪 Testing & Verification

Run the complete backend automated test suite:
```bash
cd backend
npm test
```

### Verified Test Matrix (30 / 30 Passed):
1. **Authentication Suite (`src/tests/auth.test.js`)**: 8/8 Passed
2. **Daily Streak Engine & Anti-Cheat Suite (`src/tests/streak.test.js`)**: 11/11 Passed
3. **E2E Integration & Ledger Audit Suite (`src/tests/e2e_full_audit.test.js`)**: 10/10 Passed
4. **Frontend Production Build (`vite build`)**: Built cleanly in 2.2s with 0 errors.

Full testing logs and test vectors are documented in [`docs/TESTING.md`](file:///d:/Veloop%20Task/docs/TESTING.md).

---

## 📬 Postman API Collection

Import the pre-configured Postman collection and environment files from [`postman/`](file:///d:/Veloop%20Task/postman/README.md):
* [`postman/VELOOP_Rewards_API.postman_collection.json`](file:///d:/Veloop%20Task/postman/VELOOP_Rewards_API.postman_collection.json)
* [`postman/VELOOP_Local.postman_environment.json`](file:///d:/Veloop%20Task/postman/VELOOP_Local.postman_environment.json)

---

## 🔒 Security Summary

* **Server-Authoritative State**: Timers, claim eligibility, reward configuration, and streak counts originate strictly from MongoDB.
* **Zero Client Authority**: The claim endpoint requires zero payload; injected fields are discarded.
* **Concurrency Defense**: Atomic updates + compound unique index `{ userId: 1, cycleId: 1, day: 1 }` prevent duplicate claims across multiple tabs.
* **Error Sanitization**: Raw database errors, CastErrors, and stack traces are never exposed to clients.

---

## 🌐 Planned Deployment Architecture

* **Frontend**: Vercel / Netlify (SPA build with client routing and environment variables)
* **Backend**: Render / Railway / Node container
* **Database**: MongoDB Atlas (Cloud cluster with TLS encryption)

---

## 👤 Demo Credentials (Development / Evaluation)
* **Email**: `intern.demo@velooprewards.in`
* **Password**: `DemoPassword123!`
* *(Auto-initialized by the frontend when running in evaluation mode if unauthenticated).*

---

## 📖 Additional Documentation
* [API Documentation](file:///d:/Veloop%20Task/docs/API_DOCUMENTATION.md)
* [Database Architecture](file:///d:/Veloop%20Task/docs/DATABASE.md)
* [Security & Anti-Cheat Guide](file:///d:/Veloop%20Task/docs/SECURITY.md)
* [Testing & Audit Matrix](file:///d:/Veloop%20Task/docs/TESTING.md)
