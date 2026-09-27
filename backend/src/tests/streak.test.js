import http from 'http';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';
import Wallet from '../models/Wallet.js';
import StreakReward from '../models/StreakReward.js';
import StreakCycle from '../models/StreakCycle.js';
import StreakClaim from '../models/StreakClaim.js';
import WalletTransaction from '../models/WalletTransaction.js';
import AuditLog from '../models/AuditLog.js';
import { generateToken } from '../utils/token.util.js';
import { seedRewards } from '../seed/seedRewards.js';
import * as streakService from '../services/streak.service.js';

const PORT = 5056;
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

const runStreakTests = async () => {
  console.log('--- Starting VELoop Daily Streak & Anti-Cheat Test Suite ---');
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
    console.log('Connected to MongoDB for Streak Engine verification.');

    // Clean test artifacts & sync fresh indexes
    try {
      await mongoose.connection.collection('streakcycles').drop();
    } catch (e) {}
    try {
      await mongoose.connection.collection('streakclaims').drop();
    } catch (e) {}

    await User.deleteMany({ email: /@streaktest\.com$/ });
    await Wallet.deleteMany({});
    await WalletTransaction.deleteMany({});
    await AuditLog.deleteMany({});

    await StreakCycle.syncIndexes();
    await StreakClaim.syncIndexes();

    // Seed authoritative 7 rewards
    await seedRewards();

    server = app.listen(PORT);
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Create Test User A
    const userA = await User.create({
      name: 'Streak Tester A',
      email: 'usera@streaktest.com',
      password: 'HashedPassword123!',
      role: 'user',
      isActive: true
    });
    const walletA = await Wallet.create({
      userId: userA._id,
      vesBalance: 0,
      gemsBalance: 0,
      giftCardBalanceINR: 0,
      currency: 'VES'
    });
    const tokenA = generateToken({
      userId: userA._id.toString(),
      email: userA.email,
      role: userA.role
    });

    // Create Test User B
    const userB = await User.create({
      name: 'Streak Tester B',
      email: 'userb@streaktest.com',
      password: 'HashedPassword123!',
      role: 'user',
      isActive: true
    });
    const tokenB = generateToken({
      userId: userB._id.toString(),
      email: userB.email,
      role: userB.role
    });

    // -------------------------------------------------------------
    // Test 1: Unauthenticated request rejection
    // -------------------------------------------------------------
    const unauthRes = await makeRequest({
      path: '/api/daily-streak',
      method: 'GET'
    });
    assert(
      unauthRes.status === 401,
      'Unauthenticated GET /api/daily-streak is rejected with 401'
    );

    // -------------------------------------------------------------
    // Test 2: New user initial state (Day 1 Available, Days 2-7 Locked)
    // -------------------------------------------------------------
    const statusRes = await makeRequest({
      path: '/api/daily-streak',
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const statusData = statusRes.body.data;
    assert(
      statusRes.status === 200 &&
        statusData.streak.currentDay === 1 &&
        statusData.streak.isClaimEligible === true &&
        statusData.streak.currentStreak === 0 &&
        statusData.rewards.length === 7 &&
        statusData.rewards[0].status === 'AVAILABLE' &&
        statusData.rewards[1].status === 'LOCKED',
      'New user correctly receives Day 1 as AVAILABLE and Days 2-7 as LOCKED',
      JSON.stringify(statusData?.streak)
    );

    // -------------------------------------------------------------
    // Test 3: Anti-Cheat - Tampered Claim Request with Fake Values
    // Client attempts to send fake reward, fake day, fake currency, fake userId
    // -------------------------------------------------------------
    const tamperedRes = await makeRequest(
      {
        path: '/api/daily-streak/claim',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': 'application/json'
        }
      },
      {
        day: 7, // Attempting to claim Day 7 directly
        reward: 999999, // Fake reward injection
        amount: 50000,
        currency: 'USD',
        userId: userB._id.toString(), // Attempting to claim on behalf of User B
        streak: 7
      }
    );
    assert(
      tamperedRes.status === 200 &&
        tamperedRes.body.claim.day === 1 &&
        tamperedRes.body.claim.reward.amount === 5 &&
        tamperedRes.body.claim.reward.currency === 'VES' &&
        tamperedRes.body.wallet.vesBalance === 5,
      'Anti-Cheat: Backend completely ignores injected Day 7, USD currency, and fake amounts, safely granting only authoritative Day 1 (+5 VEs)',
      JSON.stringify(tamperedRes.body)
    );

    // -------------------------------------------------------------
    // Test 4: Database Integrity after Day 1 claim
    // -------------------------------------------------------------
    const claim1 = await StreakClaim.findOne({ userId: userA._id, day: 1 });
    const txn1 = await WalletTransaction.findOne({ userId: userA._id, streakDay: 1 });
    const freshWalletA = await Wallet.findOne({ userId: userA._id });

    assert(
      claim1 &&
        claim1.status === 'CLAIMED' &&
        txn1 &&
        txn1.amount === 5 &&
        txn1.balanceBefore === 0 &&
        txn1.balanceAfter === 5 &&
        freshWalletA.vesBalance === 5,
      'Database Integrity: StreakClaim, WalletTransaction, and Wallet balance accurately created and linked in MongoDB'
    );

    // -------------------------------------------------------------
    // Test 5: State after Day 1 claim (Day 1 Claimed, Day 2 Locked with countdown)
    // -------------------------------------------------------------
    const statusAfter1Res = await makeRequest({
      path: '/api/daily-streak',
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const statusAfter1Data = statusAfter1Res.body.data;
    assert(
      statusAfter1Data.streak.currentStreak === 1 &&
        statusAfter1Data.streak.isClaimEligible === false &&
        statusAfter1Data.streak.nextClaimAt !== null &&
        statusAfter1Data.rewards[0].status === 'CLAIMED' &&
        statusAfter1Data.rewards[1].status === 'LOCKED',
      'After Day 1 claim: Day 1 is marked CLAIMED, Day 2 is LOCKED with backend nextClaimAt countdown'
    );

    // -------------------------------------------------------------
    // Test 6: Anti-Cheat - Premature Claim / Cooldown Active
    // -------------------------------------------------------------
    const prematureRes = await makeRequest({
      path: '/api/daily-streak/claim',
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert(
      prematureRes.status === 400 &&
        prematureRes.body.code === 'COOLDOWN_ACTIVE' &&
        prematureRes.body.nextClaimAt !== null,
      'Anti-Cheat: Premature claim attempt during cooldown is rejected with 400 COOLDOWN_ACTIVE'
    );

    // -------------------------------------------------------------
    // Test 7: Anti-Cheat - Duplicate Sequential Claim Rejection
    // -------------------------------------------------------------
    const activeCycleA = await StreakCycle.findOne({ userId: userA._id, status: 'ACTIVE' });
    // Manually force cycle to allow check
    const dupRes = await makeRequest({
      path: '/api/daily-streak/claim',
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert(
      dupRes.status === 400 || dupRes.status === 409,
      'Duplicate sequential claim request is safely rejected'
    );

    // -------------------------------------------------------------
    // Test 8: Anti-Cheat - Concurrent Claim Race Protection
    // Simulate 5 simultaneous requests sent in parallel on a fresh user
    // -------------------------------------------------------------
    const concurrentPromises = Array(5)
      .fill(0)
      .map(() =>
        makeRequest({
          path: '/api/daily-streak/claim',
          method: 'POST',
          headers: { Authorization: `Bearer ${tokenB}` }
        })
      );

    const concurrentResults = await Promise.all(concurrentPromises);
    const successfulClaims = concurrentResults.filter((r) => r.status === 200);
    const rejectedClaims = concurrentResults.filter((r) => r.status === 409 || r.status === 400);
    const walletB = await Wallet.findOne({ userId: userB._id });

    assert(
      successfulClaims.length === 1 &&
        rejectedClaims.length === 4 &&
        walletB.vesBalance === 5,
      'Anti-Cheat: Concurrency race test - exactly 1 of 5 simultaneous requests succeeds, 4 are rejected, wallet credited strictly once (+5 VEs)'
    );

    // -------------------------------------------------------------
    // Test 9: Cooldown Progression to Day 2
    // Simulate time elapsed by setting nextEligibleClaimAt to the past
    // -------------------------------------------------------------
    await StreakCycle.updateOne(
      { userId: userA._id, status: 'ACTIVE' },
      { $set: { nextEligibleClaimAt: new Date(Date.now() - 1000) } }
    );

    const claimDay2Res = await makeRequest({
      path: '/api/daily-streak/claim',
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert(
      claimDay2Res.status === 200 &&
        claimDay2Res.body.claim.day === 2 &&
        claimDay2Res.body.claim.reward.amount === 10 &&
        claimDay2Res.body.wallet.vesBalance === 15,
      'Cooldown elapsed: Day 2 claim succeeds, crediting +10 VEs to reach 15 VEs total'
    );

    // -------------------------------------------------------------
    // Test 10: Anti-Cheat - Missed Check-In Window / Streak Reset
    // Simulate user disappearing for 72 hours (past claimWindowExpiresAt)
    // -------------------------------------------------------------
    // Set claimWindowExpiresAt to 2 days ago
    await StreakCycle.updateOne(
      { userId: userA._id, status: 'ACTIVE' },
      {
        $set: {
          lastClaimedDay: 2,
          claimWindowExpiresAt: new Date(Date.now() - 48 * 60 * 60 * 1000)
        }
      }
    );

    const statusMissedRes = await makeRequest({
      path: '/api/daily-streak',
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const statusMissedData = statusMissedRes.body.data;

    assert(
      statusMissedRes.status === 200 &&
        statusMissedData.streak.wasReset === true &&
        statusMissedData.streak.currentStreak === 0 &&
        statusMissedData.streak.currentDay === 1 &&
        statusMissedData.rewards[0].status === 'AVAILABLE',
      'Missed-Day Logic: Expired claim window automatically triggers server-side streak reset back to Day 1'
    );

    // -------------------------------------------------------------
    // Test 11: Audit Log Generation for Security Events
    // -------------------------------------------------------------
    const resetLogs = await AuditLog.find({ userId: userA._id, event: 'STREAK_RESET' });
    const successLogs = await AuditLog.find({ event: 'STREAK_CLAIM_SUCCESS' });
    const rejectedLogs = await AuditLog.find({ event: { $in: ['DUPLICATE_CLAIM', 'STREAK_CLAIM_REJECTED'] } });

    assert(
      resetLogs.length > 0 && successLogs.length > 0 && rejectedLogs.length > 0,
      'Security Audit Log: Events recorded for STREAK_RESET, STREAK_CLAIM_SUCCESS, and rejection/duplicate protection'
    );

    console.log(`\n--- Test Suite Summary: ${testsPassed} passed, ${testsFailed} failed ---`);
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    if (server) server.close();
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  }
};

runStreakTests();
