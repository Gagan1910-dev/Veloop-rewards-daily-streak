import http from 'http';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';
import Wallet from '../models/Wallet.js';
import StreakCycle from '../models/StreakCycle.js';
import StreakClaim from '../models/StreakClaim.js';
import WalletTransaction from '../models/WalletTransaction.js';
import AuditLog from '../models/AuditLog.js';
import { seedRewards } from '../seed/seedRewards.js';

const PORT = 5057;
let server;

const makeRequest = (options, postData = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        ...options
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const parsed = body ? JSON.parse(body) : {};
            resolve({ status: res.statusCode, headers: res.headers, body: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, headers: res.headers, body });
          }
        });
      }
    );

    req.on('error', reject);

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
};

const runFullIntegrationAudit = async () => {
  console.log('=== Starting Complete E2E Integration & Anti-Cheat Audit ===');
  let testsPassed = 0;
  let testsFailed = 0;

  const assert = (condition, testName, details = '') => {
    if (condition) {
      console.log(`✓ PASS: ${testName}`);
      testsPassed++;
    } else {
      console.error(`✗ FAIL: ${testName} - ${details}`);
      testsFailed++;
    }
  };

  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/veloop_test';
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });

    try {
      await mongoose.connection.collection('streakcycles').drop();
    } catch (e) {}
    try {
      await mongoose.connection.collection('streakclaims').drop();
    } catch (e) {}

    await User.deleteMany({ email: /@audit\.veloop\.in$/ });
    await Wallet.deleteMany({});
    await WalletTransaction.deleteMany({});
    await AuditLog.deleteMany({});

    await StreakCycle.syncIndexes();
    await StreakClaim.syncIndexes();
    await seedRewards();

    server = app.listen(PORT);
    await new Promise((resolve) => setTimeout(resolve, 300));

    // AUDIT 1: Register User & Verify Zero-Balance Wallet Creation
    const registerRes = await makeRequest(
      {
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        name: 'Audit User',
        email: 'auditor@audit.veloop.in',
        password: 'AuditPassword123!'
      }
    );
    assert(
      registerRes.status === 201 &&
        registerRes.body.success === true &&
        registerRes.body.data.wallet.vesBalance === 0 &&
        registerRes.body.data.wallet.gemsBalance === 0,
      'AUDIT 1 - Registration initializes zero-balance wallet and returns JWT'
    );

    const token = registerRes.body.data.token;
    const userId = registerRes.body.data.user.id;

    // AUDIT 2: Login Endpoint
    const loginRes = await makeRequest(
      {
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        email: 'auditor@audit.veloop.in',
        password: 'AuditPassword123!'
      }
    );
    assert(
      loginRes.status === 200 &&
        loginRes.body.success === true &&
        loginRes.body.data.token &&
        !loginRes.body.data.user.password,
      'AUDIT 2 - Login verifies credentials and returns JWT without leaking password hash'
    );

    // AUDIT 3: Protected Profile (GET /api/auth/me)
    const meRes = await makeRequest({
      path: '/api/auth/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(
      meRes.status === 200 &&
        meRes.body.data.user.email === 'auditor@audit.veloop.in' &&
        meRes.body.data.wallet.vesBalance === 0,
      'AUDIT 3 - GET /api/auth/me accurately resolves user profile and wallet from JWT'
    );

    // AUDIT 4: Initial Streak Status (GET /api/daily-streak)
    const streakRes = await makeRequest({
      path: '/api/daily-streak',
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });
    const streakBody = streakRes.body.data;
    assert(
      streakRes.status === 200 &&
        streakBody.streak.currentStreak === 0 &&
        streakBody.streak.currentDay === 1 &&
        streakBody.streak.isClaimEligible === true &&
        streakBody.rewards[0].status === 'AVAILABLE' &&
        streakBody.rewards[1].status === 'LOCKED' &&
        streakBody.rewards.length === 7 &&
        Boolean(streakBody.serverTime),
      'AUDIT 4 - GET /api/daily-streak returns 7 configured rewards with Day 1 AVAILABLE & serverTime'
    );

    // AUDIT 5: Full Claim Flow - Valid Day 1 Claim (POST /api/daily-streak/claim with empty body)
    const claimRes = await makeRequest(
      {
        path: '/api/daily-streak/claim',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      },
      {} // Zero body as specified
    );
    assert(
      claimRes.status === 200 &&
        claimRes.body.success === true &&
        claimRes.body.claim.day === 1 &&
        claimRes.body.claim.reward.amount === 5 &&
        claimRes.body.wallet.vesBalance === 5 &&
        claimRes.body.streak.currentStreak === 1 &&
        Boolean(claimRes.body.streak.nextClaimAt),
      'AUDIT 5 - Zero-payload claim correctly grants Day 1 (+5 VEs), updates wallet to 5 VEs, and returns nextClaimAt'
    );

    // AUDIT 6: State Refresh Verification (GET /api/daily-streak after claim)
    const streakAfterRes = await makeRequest({
      path: '/api/daily-streak',
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });
    const streakAfterBody = streakAfterRes.body.data;
    assert(
      streakAfterBody.streak.currentStreak === 1 &&
        streakAfterBody.streak.isClaimEligible === false &&
        streakAfterBody.rewards[0].status === 'CLAIMED' &&
        streakAfterBody.rewards[1].status === 'LOCKED' &&
        Boolean(streakAfterBody.streak.nextClaimAt),
      'AUDIT 6 - Refreshed streak status reflects Day 1 CLAIMED and Day 2 LOCKED with server countdown'
    );

    // AUDIT 7: Anti-Cheat - Cooldown Enforcement
    const cooldownRes = await makeRequest({
      path: '/api/daily-streak/claim',
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(
      cooldownRes.status === 400 && cooldownRes.body.code === 'COOLDOWN_ACTIVE',
      'AUDIT 7 - Anti-Cheat: Premature claim during cooldown rejected with 400 COOLDOWN_ACTIVE'
    );

    // AUDIT 8: Anti-Cheat - Payload Forgery Defense
    // User tries to send { day: 7, reward: 1000000, currency: 'USD', userId: 'hacked_id' }
    await StreakCycle.updateOne(
      { userId, status: 'ACTIVE' },
      { $set: { nextEligibleClaimAt: new Date(Date.now() - 1000) } }
    );
    const forgedRes = await makeRequest(
      {
        path: '/api/daily-streak/claim',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      },
      {
        day: 7,
        reward: 1000000,
        amount: 999999,
        currency: 'USD',
        userId: 'some_other_user_id',
        streak: 7
      }
    );
    assert(
      forgedRes.status === 200 &&
        forgedRes.body.claim.day === 2 &&
        forgedRes.body.claim.reward.amount === 10 &&
        forgedRes.body.claim.reward.currency === 'VES' &&
        forgedRes.body.wallet.vesBalance === 15,
      'AUDIT 8 - Anti-Cheat: Injected fake payload completely ignored; backend derives Day 2 (+10 VEs, new wallet: 15 VEs)'
    );

    // AUDIT 9: Ledger History (GET /api/daily-streak/history)
    const historyRes = await makeRequest({
      path: '/api/daily-streak/history',
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(
      historyRes.status === 200 &&
        Array.isArray(historyRes.body.data) &&
        historyRes.body.data.length === 2 &&
        historyRes.body.data[0].day === 2 &&
        historyRes.body.data[1].day === 1,
      'AUDIT 9 - GET /api/daily-streak/history returns immutable audit records for Day 1 and Day 2 claims'
    );

    // AUDIT 10: Database Relational Integrity
    const claims = await StreakClaim.find({ userId });
    const transactions = await WalletTransaction.find({ userId });
    const auditLogs = await AuditLog.find({ userId });
    const finalWallet = await Wallet.findOne({ userId });

    assert(
      claims.length === 2 &&
        transactions.length === 2 &&
        auditLogs.length >= 3 &&
        finalWallet.vesBalance === 15,
      'AUDIT 10 - Database Integrity: 2 StreakClaims, 2 WalletTransactions, matching AuditLogs, and accurate Wallet in MongoDB'
    );

    console.log(`\n=== E2E Integration Audit Summary: ${testsPassed} passed, ${testsFailed} failed ===`);
  } catch (err) {
    console.error('Audit execution error:', err);
  } finally {
    if (server) server.close();
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  }
};

runFullIntegrationAudit();
