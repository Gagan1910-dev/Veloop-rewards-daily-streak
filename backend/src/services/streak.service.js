import crypto from 'crypto';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Wallet from '../models/Wallet.js';
import StreakReward from '../models/StreakReward.js';
import StreakCycle from '../models/StreakCycle.js';
import StreakClaim from '../models/StreakClaim.js';
import WalletTransaction from '../models/WalletTransaction.js';
import AuditLog from '../models/AuditLog.js';
import { DEFAULT_STREAK_REWARDS } from '../seed/seedRewards.js';

// Cooldown and Missed streak configuration (in milliseconds)
// 24 hours standard cooldown; 48 hours total from claim before considered missed
const COOLDOWN_MS = Number(process.env.STREAK_COOLDOWN_MS) || 24 * 60 * 60 * 1000;
const MISSED_WINDOW_MS = Number(process.env.STREAK_MISSED_WINDOW_MS) || 48 * 60 * 60 * 1000;

/**
 * Ensure database has the 7 standard rewards configured
 */
export const ensureRewardsSeeded = async () => {
  const count = await StreakReward.countDocuments();
  if (count < 7) {
    for (const reward of DEFAULT_STREAK_REWARDS) {
      await StreakReward.findOneAndUpdate(
        { day: reward.day },
        { $set: reward },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
    }
  }
};

/**
 * Fetch or create an active streak cycle for the user
 * Also evaluates missed-streak logic based on server time
 */
export const getOrCreateActiveCycle = async (userId, currentTime = new Date()) => {
  const now = new Date(currentTime);

  let activeCycle = await StreakCycle.findOne({
    userId,
    status: 'ACTIVE'
  }).sort({ createdAt: -1 });

  // If no active cycle exists, find or create one atomically
  if (!activeCycle) {
    try {
      const lastCycle = await StreakCycle.findOne({ userId }).sort({ cycleNumber: -1 });
      const nextCycleNumber = lastCycle ? lastCycle.cycleNumber + 1 : 1;

      // If previous cycle was completed, the new cycle inherits the nextEligibleClaimAt cooldown from Day 7
      let initialEligibleAt = now;
      if (lastCycle && lastCycle.status === 'COMPLETED' && lastCycle.nextEligibleClaimAt) {
        initialEligibleAt = lastCycle.nextEligibleClaimAt;
      }

      activeCycle = await StreakCycle.findOneAndUpdate(
        { userId, status: 'ACTIVE' },
        {
          $setOnInsert: {
            cycleId: `CYC-${crypto.randomUUID()}`,
            userId,
            cycleNumber: nextCycleNumber,
            status: 'ACTIVE',
            currentStreak: 0,
            lastClaimedDay: 0,
            lastClaimedAt: null,
            nextEligibleClaimAt: initialEligibleAt,
            claimWindowExpiresAt: null
          }
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
    } catch (err) {
      if (err.code === 11000) {
        // Handled race condition: active cycle was created by parallel thread
        activeCycle = await StreakCycle.findOne({ userId, status: 'ACTIVE' });
      } else {
        throw err;
      }
    }

    return { cycle: activeCycle, wasReset: false };
  }

  // If active cycle exists and user has claimed at least one day, check if they missed the claim window
  if (activeCycle.lastClaimedDay > 0 && activeCycle.claimWindowExpiresAt) {
    if (now > new Date(activeCycle.claimWindowExpiresAt)) {
      // User missed the check-in window -> Reset streak
      activeCycle.status = 'RESET';
      await activeCycle.save();

      // Log the reset event
      await AuditLog.create({
        userId,
        event: 'STREAK_RESET',
        status: 'WARNING',
        details: {
          cycleId: activeCycle.cycleId,
          lastClaimedDay: activeCycle.lastClaimedDay,
          lastClaimedAt: activeCycle.lastClaimedAt,
          claimWindowExpiresAt: activeCycle.claimWindowExpiresAt,
          evaluatedAt: now,
          reason: 'User failed to claim within the required claim window'
        }
      });

      // Start new active cycle from Day 1
      const newCycle = await StreakCycle.create({
        cycleId: `CYC-${crypto.randomUUID()}`,
        userId,
        cycleNumber: activeCycle.cycleNumber + 1,
        status: 'ACTIVE',
        currentStreak: 0,
        lastClaimedDay: 0,
        lastClaimedAt: null,
        nextEligibleClaimAt: now,
        claimWindowExpiresAt: null
      });

      return { cycle: newCycle, wasReset: true, previousCycle: activeCycle };
    }
  }

  return { cycle: activeCycle, wasReset: false };
};

/**
 * Get comprehensive streak status for user
 */
export const getStreakStatus = async (userId, currentTime = new Date()) => {
  await ensureRewardsSeeded();
  const now = new Date(currentTime);

  const { cycle, wasReset } = await getOrCreateActiveCycle(userId, now);
  const rewardsConfig = await StreakReward.find({ active: true }).sort({ day: 1 });

  // Determine current actionable day and user eligibility
  const lastClaimedDay = cycle.lastClaimedDay || 0;
  const isCycleCompleted = cycle.status === 'COMPLETED' || lastClaimedDay >= 7;

  let currentTargetDay = 1;
  let isClaimEligible = false;
  let nextClaimAt = null;

  if (lastClaimedDay === 0) {
    // New cycle: Day 1 is actionable if cooldown elapsed
    currentTargetDay = 1;
    if (cycle.nextEligibleClaimAt && now < new Date(cycle.nextEligibleClaimAt)) {
      isClaimEligible = false;
      nextClaimAt = cycle.nextEligibleClaimAt.toISOString();
    } else {
      isClaimEligible = true;
      nextClaimAt = null;
    }
  } else if (lastClaimedDay < 7) {
    currentTargetDay = lastClaimedDay + 1;
    if (cycle.nextEligibleClaimAt && now >= new Date(cycle.nextEligibleClaimAt)) {
      isClaimEligible = true;
      nextClaimAt = null;
    } else {
      isClaimEligible = false;
      nextClaimAt = cycle.nextEligibleClaimAt ? cycle.nextEligibleClaimAt.toISOString() : null;
    }
  } else {
    // All 7 days completed
    currentTargetDay = 7;
    isClaimEligible = false;
    nextClaimAt = null;
  }

  // Fetch claimed records for this active cycle
  const claims = await StreakClaim.find({
    userId,
    cycleId: cycle.cycleId
  });
  const claimedDaysMap = new Set(claims.map((c) => c.day));

  // Build card states for all 7 days
  const cards = rewardsConfig.map((reward) => {
    let status = 'LOCKED';
    let cardNextClaimAt = null;

    if (claimedDaysMap.has(reward.day)) {
      status = 'CLAIMED';
    } else if (reward.day === currentTargetDay) {
      if (isClaimEligible) {
        status = 'AVAILABLE';
      } else {
        status = 'LOCKED';
        cardNextClaimAt = nextClaimAt;
      }
    } else {
      status = 'LOCKED';
    }

    return {
      day: reward.day,
      title: reward.title,
      subtitle: reward.subtitle,
      description: reward.description,
      asset: reward.asset,
      reward: {
        type: reward.rewardType,
        amount: reward.amount,
        currency: reward.currency
      },
      metadata: reward.metadata,
      status, // 'CLAIMED' | 'AVAILABLE' | 'LOCKED'
      isActionableToday: reward.day === currentTargetDay,
      nextClaimAt: cardNextClaimAt
    };
  });

  // Calculate statistics
  const checkedIn = cycle.currentStreak || lastClaimedDay;
  const totalRewards = rewardsConfig.length || 7;
  const nextRewardConfig = rewardsConfig.find((r) => r.day === currentTargetDay) || rewardsConfig[0];

  return {
    serverTime: now.toISOString(),
    streak: {
      cycleId: cycle.cycleId,
      cycleNumber: cycle.cycleNumber,
      currentStreak: cycle.currentStreak,
      currentDay: currentTargetDay,
      checkedIn,
      totalRewards,
      status: cycle.status,
      isClaimEligible,
      nextClaimAt,
      wasReset
    },
    nextReward: {
      day: nextRewardConfig.day,
      amount: nextRewardConfig.amount,
      currency: nextRewardConfig.currency,
      title: nextRewardConfig.title,
      subtitle: nextRewardConfig.subtitle,
      asset: nextRewardConfig.asset
    },
    ultimateReward: {
      day: 7,
      amount: 5,
      currency: 'INR',
      title: '₹5',
      subtitle: 'Amazon Gift Card',
      unlockDay: 7,
      asset: 'crown'
    },
    rewards: cards
  };
};

/**
 * Execute daily streak claim with strict server-side validation, concurrency locking, and idempotency
 */
export const claimDailyReward = async (userId, reqContext = {}, currentTime = new Date()) => {
  await ensureRewardsSeeded();

  const now = new Date(currentTime);

  // Log incoming claim request attempt
  await AuditLog.create({
    userId,
    event: 'STREAK_CLAIM_REQUEST',
    status: 'INFO',
    details: {
      ipAddress: reqContext.ip || '',
      userAgent: reqContext.userAgent || '',
      clientPayloadIgnored: reqContext.body || {}
    }
  });

  // Fetch active user
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    const error = new Error('User account is invalid or inactive');
    error.statusCode = 403;
    throw error;
  }

  // Fetch or evaluate active cycle (handles missed day reset automatically)
  const { cycle, wasReset } = await getOrCreateActiveCycle(userId, now);

  if (wasReset) {
    const error = new Error('Your previous streak was missed and has been reset. Please claim Day 1.');
    error.statusCode = 400;
    error.code = 'STREAK_RESET';
    throw error;
  }

  const lastClaimedDay = cycle.lastClaimedDay || 0;

  // Validate cycle not already completed
  if (lastClaimedDay >= 7) {
    const error = new Error('You have already completed all 7 days of this streak cycle.');
    error.statusCode = 400;
    error.code = 'CYCLE_ALREADY_COMPLETED';
    throw error;
  }

  // Derive target day strictly from server cycle state
  const targetDay = lastClaimedDay + 1;

  // Previous-Day Validation: If targetDay > 1, verify Day N-1 was claimed in this cycle
  if (targetDay > 1) {
    const prevClaim = await StreakClaim.findOne({
      userId,
      cycleId: cycle.cycleId,
      day: targetDay - 1
    });

    if (!prevClaim) {
      await AuditLog.create({
        userId,
        event: 'INVALID_CLAIM',
        status: 'CRITICAL',
        details: {
          attemptedDay: targetDay,
          cycleId: cycle.cycleId,
          reason: 'Previous day claim missing'
        }
      });
      const error = new Error(`Cannot claim Day ${targetDay}. Previous day was not claimed.`);
      error.statusCode = 400;
      error.code = 'PREVIOUS_DAY_UNCLAIMED';
      throw error;
    }
  }

  // Cooldown / Waiting Period Validation
  if (cycle.nextEligibleClaimAt && now < new Date(cycle.nextEligibleClaimAt)) {
    await AuditLog.create({
      userId,
      event: 'STREAK_CLAIM_REJECTED',
      status: 'WARNING',
      details: {
        attemptedDay: targetDay,
        cycleId: cycle.cycleId,
        serverTime: now,
        nextEligibleClaimAt: cycle.nextEligibleClaimAt,
        reason: 'Attempted claim before cooldown elapsed'
      }
    });
    const error = new Error('Your next reward is not available yet. Please wait until the countdown ends.');
    error.statusCode = 400;
    error.code = 'COOLDOWN_ACTIVE';
    error.nextClaimAt = cycle.nextEligibleClaimAt.toISOString();
    throw error;
  }

  // Fetch configured authoritative reward from DB
  const rewardConfig = await StreakReward.findOne({ day: targetDay, active: true });
  if (!rewardConfig) {
    const error = new Error(`Reward configuration for Day ${targetDay} not found.`);
    error.statusCode = 500;
    throw error;
  }

  // Calculate next cooldown and missed window
  const nextClaimTime = new Date(now.getTime() + COOLDOWN_MS);
  const claimWindowExpiry = new Date(now.getTime() + MISSED_WINDOW_MS);

  // ATOMIC CONDITIONAL LOCK ON STREAKCYCLE:
  // Atomically advances lastClaimedDay if and only if lastClaimedDay == targetDay - 1
  // This guarantees that across multiple concurrent threads/tabs, exactly one acquires the claim transition
  const lockedCycle = await StreakCycle.findOneAndUpdate(
    {
      _id: cycle._id,
      status: 'ACTIVE',
      lastClaimedDay: targetDay - 1
    },
    {
      $set: {
        currentStreak: targetDay,
        lastClaimedDay: targetDay,
        lastClaimedAt: now,
        nextEligibleClaimAt: nextClaimTime,
        claimWindowExpiresAt: claimWindowExpiry,
        ...(targetDay === 7 ? { status: 'COMPLETED', completedAt: now } : {})
      }
    },
    { returnDocument: 'after' }
  );

  if (!lockedCycle) {
    // Another concurrent request or previous claim won the race
    await AuditLog.create({
      userId,
      event: 'DUPLICATE_CLAIM',
      status: 'WARNING',
      details: {
        cycleId: cycle.cycleId,
        attemptedDay: targetDay,
        reason: 'Concurrent race condition or duplicate claim prevented by atomic cycle lock'
      }
    });
    const error = new Error('This reward has already been claimed.');
    error.statusCode = 409;
    error.code = 'ALREADY_CLAIMED';
    throw error;
  }

  // Fetch or initialize user wallet
  let wallet = await Wallet.findOne({ userId });
  if (!wallet) {
    wallet = await Wallet.create({
      userId,
      vesBalance: 0,
      gemsBalance: 0,
      giftCardBalanceINR: 0,
      currency: 'VES'
    });
  }

  // Prepare ledger transaction details
  const transactionId = `TXN-${crypto.randomUUID()}`;
  const claimId = `CLM-${crypto.randomUUID()}`;
  const referenceId = `STREAK-${targetDay}-${claimId.slice(-8)}`;

  let balanceBefore = 0;
  let balanceAfter = 0;

  if (rewardConfig.currency === 'VES' || rewardConfig.rewardType === 'VES') {
    balanceBefore = wallet.vesBalance;
    balanceAfter = wallet.vesBalance + rewardConfig.amount;
    wallet.vesBalance = balanceAfter;
  } else if (rewardConfig.currency === 'INR' || rewardConfig.rewardType === 'GIFT_CARD') {
    balanceBefore = wallet.giftCardBalanceINR;
    balanceAfter = wallet.giftCardBalanceINR + rewardConfig.amount;
    wallet.giftCardBalanceINR = balanceAfter;
  } else {
    balanceBefore = wallet.vesBalance;
    balanceAfter = wallet.vesBalance + rewardConfig.amount;
    wallet.vesBalance = balanceAfter;
  }

  wallet.lastUpdated = now;

  // Insert immutable StreakClaim record
  let createdClaim;
  try {
    createdClaim = await StreakClaim.create({
      claimId,
      userId,
      cycleId: cycle.cycleId,
      day: targetDay,
      rewardId: rewardConfig._id,
      rewardSnapshot: {
        rewardType: rewardConfig.rewardType,
        currency: rewardConfig.currency,
        amount: rewardConfig.amount,
        title: rewardConfig.title
      },
      status: 'CLAIMED',
      claimedAt: now,
      transactionId
    });
  } catch (dbErr) {
    if (dbErr.code === 11000) {
      await AuditLog.create({
        userId,
        event: 'DUPLICATE_CLAIM',
        status: 'WARNING',
        details: {
          cycleId: cycle.cycleId,
          day: targetDay,
          error: 'Duplicate compound index violation caught'
        }
      });
      const error = new Error('This reward has already been claimed.');
      error.statusCode = 409;
      error.code = 'ALREADY_CLAIMED';
      throw error;
    }
    throw dbErr;
  }

  // Save updated wallet balance
  await wallet.save();

  // Create financial audit ledger transaction
  await WalletTransaction.create({
    transactionId,
    userId,
    currency: rewardConfig.currency,
    type: 'CREDIT',
    amount: rewardConfig.amount,
    source: 'DAILY_STREAK',
    streakDay: targetDay,
    referenceId,
    balanceBefore,
    balanceAfter,
    status: 'SUCCESS',
    metadata: {
      cycleId: cycle.cycleId,
      claimId,
      rewardTitle: rewardConfig.title,
      rewardSubtitle: rewardConfig.subtitle
    }
  });

  // Audit log success
  await AuditLog.create({
    userId,
    event: 'STREAK_CLAIM_SUCCESS',
    status: 'SUCCESS',
    details: {
      cycleId: cycle.cycleId,
      day: targetDay,
      reward: rewardConfig.title,
      amount: rewardConfig.amount,
      currency: rewardConfig.currency,
      transactionId,
      claimId
    }
  });

  return {
    success: true,
    message: `Day ${targetDay} reward claimed successfully!`,
    serverTime: now.toISOString(),
    claim: {
      claimId: createdClaim.claimId,
      day: targetDay,
      reward: {
        title: rewardConfig.title,
        subtitle: rewardConfig.subtitle,
        amount: rewardConfig.amount,
        currency: rewardConfig.currency,
        rewardType: rewardConfig.rewardType,
        asset: rewardConfig.asset
      },
      claimedAt: now.toISOString(),
      transactionId,
      referenceId
    },
    streak: {
      currentStreak: lockedCycle.currentStreak,
      lastClaimedDay: lockedCycle.lastClaimedDay,
      nextClaimAt: targetDay < 7 ? nextClaimTime.toISOString() : null,
      cycleStatus: lockedCycle.status
    },
    wallet: {
      vesBalance: wallet.vesBalance,
      gemsBalance: wallet.gemsBalance,
      giftCardBalanceINR: wallet.giftCardBalanceINR,
      currency: wallet.currency
    }
  };
};

/**
 * Fetch check-in history for user
 */
export const getStreakHistory = async (userId) => {
  const claims = await StreakClaim.find({ userId })
    .sort({ claimedAt: -1 })
    .limit(50);

  return claims.map((c) => ({
    claimId: c.claimId,
    cycleId: c.cycleId,
    day: c.day,
    reward: c.rewardSnapshot,
    claimedAt: c.claimedAt,
    transactionId: c.transactionId
  }));
};
