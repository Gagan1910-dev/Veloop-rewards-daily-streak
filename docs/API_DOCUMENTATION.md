# VELoop Rewards — REST API Documentation

Comprehensive API documentation for the VELoop Rewards Daily Streak & Authentication system.

---

## 1. General Specifications
* **Base URL (Local)**: `http://localhost:5000/api`
* **Base URL (Production)**: `https://<deployed-backend-url>/api`
* **Content-Type**: `application/json`
* **Authentication**: HTTP Bearer Token (`Authorization: Bearer <JWT>`)

---

## 2. API Endpoints

### 2.1. System Health Check
* **Method**: `GET`
* **Path**: `/api/health`
* **Auth Required**: No
* **Description**: Returns the server health status and authoritative UTC server timestamp.

**Response (`200 OK`)**:
```json
{
  "success": true,
  "status": "online",
  "service": "VELoop Rewards API",
  "serverTime": "2026-09-26T00:00:00.000Z"
}
```

---

### 2.2. User Registration
* **Method**: `POST`
* **Path**: `/api/auth/register`
* **Auth Required**: No
* **Description**: Registers a new user account, salts/hashes password with bcrypt, initializes a clean zero-balance Wallet (`vesBalance: 0`, `gemsBalance: 0`, `giftCardBalanceINR: 0`), and issues a signed JWT.

**Request Body**:
```json
{
  "name": "Gagan Chandra",
  "email": "gagan@velooprewards.in",
  "password": "SecurePassword123!"
}
```

**Response (`201 Created`)**:
```json
{
  "success": true,
  "message": "Account registered successfully",
  "data": {
    "user": {
      "id": "66fb1234567890abcdef1234",
      "name": "Gagan Chandra",
      "email": "gagan@velooprewards.in",
      "role": "user",
      "createdAt": "2026-09-26T00:00:00.000Z"
    },
    "wallet": {
      "vesBalance": 0,
      "gemsBalance": 0,
      "giftCardBalanceINR": 0,
      "currency": "VES"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses**:
* `400 Bad Request`: Validation failure (name $< 2$ characters, invalid email regex, password $< 6$ characters).
* `409 Conflict`: `{"success": false, "message": "An account with this email address already exists"}`

---

### 2.3. User Login
* **Method**: `POST`
* **Path**: `/api/auth/login`
* **Auth Required**: No
* **Description**: Authenticates user credentials and issues a signed JWT token without leaking password hashes.

**Request Body**:
```json
{
  "email": "gagan@velooprewards.in",
  "password": "SecurePassword123!"
}
```

**Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "66fb1234567890abcdef1234",
      "name": "Gagan Chandra",
      "email": "gagan@velooprewards.in",
      "role": "user",
      "createdAt": "2026-09-26T00:00:00.000Z"
    },
    "wallet": {
      "vesBalance": 0,
      "gemsBalance": 0,
      "giftCardBalanceINR": 0,
      "currency": "VES"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses**:
* `401 Unauthorized`: Invalid email or password.

---

### 2.4. Get Authenticated Profile (`/me`)
* **Method**: `GET`
* **Path**: `/api/auth/me`
* **Auth Required**: Yes (`Bearer <JWT>`)
* **Description**: Returns the authentic profile and live wallet balance for the user derived strictly from the verified JWT.

**Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "66fb1234567890abcdef1234",
      "name": "Gagan Chandra",
      "email": "gagan@velooprewards.in",
      "role": "user",
      "createdAt": "2026-09-26T00:00:00.000Z"
    },
    "wallet": {
      "vesBalance": 15,
      "gemsBalance": 0,
      "giftCardBalanceINR": 0,
      "currency": "VES"
    }
  }
}
```

---

### 2.5. Get Daily Streak Status
* **Method**: `GET`
* **Path**: `/api/daily-streak`
* **Auth Required**: Yes (`Bearer <JWT>`)
* **Description**: Returns server-authoritative streak state, current active day, statistics, nextClaimAt countdown, and the 7-day reward card array with real-time statuses (`CLAIMED`, `AVAILABLE`, `LOCKED`).

**Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "serverTime": "2026-09-26T00:00:00.000Z",
    "streak": {
      "cycleId": "CYC-9a7c3905-18ef-4171-a4b5-68ffda464b07",
      "cycleNumber": 1,
      "currentStreak": 1,
      "currentDay": 2,
      "checkedIn": 1,
      "totalRewards": 7,
      "status": "ACTIVE",
      "isClaimEligible": false,
      "nextClaimAt": "2026-09-27T00:00:00.000Z",
      "wasReset": false
    },
    "nextReward": {
      "day": 2,
      "amount": 10,
      "currency": "VES",
      "title": "+10",
      "subtitle": "10 VEs",
      "asset": "coin"
    },
    "ultimateReward": {
      "day": 7,
      "amount": 5,
      "currency": "INR",
      "title": "₹5",
      "subtitle": "Amazon Gift Card",
      "unlockDay": 7,
      "asset": "crown"
    },
    "rewards": [
      {
        "day": 1,
        "title": "+5",
        "subtitle": "5 VEs",
        "description": "Day 1 Check-In Reward: +5 VEs",
        "asset": "coin",
        "reward": {
          "type": "VES",
          "amount": 5,
          "currency": "VES"
        },
        "metadata": {
          "badge": null,
          "isUltimate": false,
          "brand": "VELoop"
        },
        "status": "CLAIMED",
        "isActionableToday": false,
        "nextClaimAt": null
      },
      {
        "day": 2,
        "title": "+10",
        "subtitle": "10 VEs",
        "description": "Day 2 Check-In Reward: +10 VEs",
        "asset": "coin",
        "reward": {
          "type": "VES",
          "amount": 10,
          "currency": "VES"
        },
        "metadata": {
          "badge": "Today",
          "isUltimate": false,
          "brand": "VELoop"
        },
        "status": "LOCKED",
        "isActionableToday": true,
        "nextClaimAt": "2026-09-27T00:00:00.000Z"
      }
    ]
  }
}
```

---

### 2.6. Claim Daily Reward
* **Method**: `POST`
* **Path**: `/api/daily-streak/claim`
* **Auth Required**: Yes (`Bearer <JWT>`)
* **Description**: Atomically processes today's check-in claim. Disregards any client-injected day, reward amount, currency, or user ID.

**Request Body**:
```json
{}
```

**Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Day 1 reward claimed successfully!",
  "serverTime": "2026-09-26T00:00:00.000Z",
  "claim": {
    "claimId": "CLM-61e874ce-e260-47b6-b0ff-fb0f6700c0ce",
    "day": 1,
    "reward": {
      "title": "+5",
      "subtitle": "5 VEs",
      "amount": 5,
      "currency": "VES",
      "rewardType": "VES",
      "asset": "coin"
    },
    "claimedAt": "2026-09-26T00:00:00.000Z",
    "transactionId": "TXN-b9fa969f-3d14-4113-a8d6-e9185a111b11",
    "referenceId": "STREAK-1-fb0f6700"
  },
  "streak": {
    "currentStreak": 1,
    "lastClaimedDay": 1,
    "nextClaimAt": "2026-09-27T00:00:00.000Z",
    "cycleStatus": "ACTIVE"
  },
  "wallet": {
    "vesBalance": 5,
    "gemsBalance": 0,
    "giftCardBalanceINR": 0,
    "currency": "VES"
  }
}
```

**Error Responses**:
* `400 Bad Request` (`code: 'COOLDOWN_ACTIVE'`): Active waiting cooldown before next claim.
* `400 Bad Request` (`code: 'PREVIOUS_DAY_UNCLAIMED'`): Previous day check-in missing in active cycle.
* `400 Bad Request` (`code: 'STREAK_RESET'`): Streak expired and reset back to Day 1.
* `409 Conflict` (`code: 'ALREADY_CLAIMED'`): Duplicate claim or concurrent race condition blocked.

---

### 2.7. Get Streak Check-In History
* **Method**: `GET`
* **Path**: `/api/daily-streak/history`
* **Auth Required**: Yes (`Bearer <JWT>`)
* **Description**: Returns immutable transaction logs and previous claims for the authenticated user.

**Response (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "claimId": "CLM-61e874ce-e260-47b6-b0ff-fb0f6700c0ce",
      "cycleId": "CYC-9a7c3905-18ef-4171-a4b5-68ffda464b07",
      "day": 1,
      "reward": {
        "rewardType": "VES",
        "currency": "VES",
        "amount": 5,
        "title": "+5"
      },
      "claimedAt": "2026-09-26T00:00:00.000Z",
      "transactionId": "TXN-b9fa969f-3d14-4113-a8d6-e9185a111b11"
    }
  ]
}
```
