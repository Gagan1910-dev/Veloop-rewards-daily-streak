import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Check,
  Lock,
  ChevronRight,
  Sparkles,
  Clock,
  Loader2,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { useCountdown } from '../../hooks/useCountdown.js';
import styles from './BentoStreakHub.module.css';

/**
 * Modern Fintech Bento Hub
 * Clean, compact Apple/Linear style layout:
 * 1. Progress & History Strip (No redundant flame badge)
 * 2. Today's Action Hub (Compact, centered pill CTA, honest cooldown countdown)
 * 3. Day 7 VIP Vault Showcase (With visual progress track)
 * 4. 7-Day Interactive Milestone Timeline Ribbon (Proper formatting, zero double-plus bug)
 */
const BentoStreakHub = ({
  streakData,
  rewards = [],
  nextReward,
  ultimateReward,
  day7Status,
  isClaiming,
  onClaim,
  onCountdownExpire,
  onOpenCalendar
}) => {
  const currentStreak = streakData?.currentStreak ?? 1;
  const checkedIn = streakData?.checkedIn ?? 1;
  const totalRewards = streakData?.totalRewards ?? 7;
  const currentDay = streakData?.currentDay ?? 1;

  // Find the actionable day or today's active day
  const todayReward =
    rewards.find((r) => r.status === 'AVAILABLE') ||
    rewards.find((r) => r.day === currentDay) ||
    rewards[0] ||
    {};

  // Interactive selected day state (defaults to actionable or current day)
  const [selectedDayNumber, setSelectedDayNumber] = useState(todayReward?.day || 1);

  // Sync selected day if rewards change
  useEffect(() => {
    if (todayReward?.day) {
      setSelectedDayNumber(todayReward.day);
    }
  }, [todayReward?.day]);

  // The active day object currently being previewed in the Action Hub
  const activeReward = rewards.find((r) => r.day === selectedDayNumber) || todayReward;
  const activeDay = activeReward?.day || 1;
  const isAvailableToClaim = activeReward?.status === 'AVAILABLE';
  const isActiveClaimed = activeReward?.status === 'CLAIMED';
  const isCooldownActive = Boolean(activeReward?.nextClaimAt);

  // Live countdown for cooldown
  const countdown = useCountdown(activeReward?.nextClaimAt, onCountdownExpire);

  // Asset image path helper
  const getAssetInfo = (day) => {
    if (day === 4) return { src: '/assets/daily-streak/Day-4.png', type: 'giftbox', alt: 'Giftbox' };
    if (day === 5) return { src: '/assets/daily-streak/Day-5.png', type: 'amazon', alt: 'Amazon Card' };
    if (day === 7) return { src: '/assets/daily-streak/Day-7.png', type: 'crown', alt: 'VIP Crown' };
    return { src: '/assets/daily-streak/VEs_Coin.png', type: 'coin', alt: 'VEs Coin' };
  };

  const activeAsset = getAssetInfo(activeDay);

  // Format title display for Hero Tile
  const formatRewardTitle = (rewardItem) => {
    if (!rewardItem) return '+5 VEs';
    const rawTitle = (rewardItem.title || '').trim();
    const isVes = rewardItem.reward?.type === 'VES';
    if (isVes) {
      return `${rawTitle.startsWith('+') ? rawTitle : `+${rawTitle}`} VEs`;
    }
    return rawTitle; // e.g. "₹1", "₹2", "₹5"
  };

  // Format timeline ribbon node value cleanly (strictly prevents double plus bug like "++10")
  const formatTimelineValue = (rewardItem) => {
    if (!rewardItem) return '';
    const rawTitle = (rewardItem.title || '').trim();
    if (rewardItem.reward?.type === 'VES') {
      return rawTitle.startsWith('+') ? rawTitle : `+${rawTitle}`;
    }
    return rawTitle;
  };

  // Progress percentage toward 7 days
  const progressPercent = Math.min(100, Math.round((checkedIn / totalRewards) * 100));

  return (
    <div className={styles.bentoContainer}>
      {/* ============================================================== */}
      {/* 1. TOP BENTO ROW: PROGRESS TRACK & STREAK HISTORY               */}
      {/* ============================================================== */}
      <div className={styles.topMetricsStrip}>
        {/* 7-Segment Progress Track */}
        <div className={styles.progressBarCard}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>
              Streak Progress • <strong>{checkedIn} of {totalRewards} Claimed</strong>
            </span>
            <span className={styles.progressPercentText}>{progressPercent}% Complete</span>
          </div>

          <div className={styles.segmentTrack}>
            {rewards.map((r) => {
              const isClaimedSegment = r.status === 'CLAIMED';
              const isTodaySegment = r.day === currentDay;
              return (
                <div
                  key={`seg-${r.day}`}
                  className={`${styles.segmentBar} ${
                    isClaimedSegment
                      ? styles.segmentClaimed
                      : isTodaySegment
                      ? styles.segmentToday
                      : styles.segmentLocked
                  }`}
                  title={`Day ${r.day}: ${r.title}`}
                />
              );
            })}
          </div>
        </div>

        {/* History Calendar Quick Button */}
        {onOpenCalendar && (
          <button
            type="button"
            className={styles.calendarTriggerBtn}
            onClick={onOpenCalendar}
            aria-label="View Streak Calendar & History"
          >
            <Calendar size={15} />
            <span className={styles.calendarTriggerLabel}>Streak History</span>
            <ChevronRight size={13} className={styles.calendarChevron} />
          </button>
        )}
      </div>

      {/* ============================================================== */}
      {/* 2. MAIN BENTO HERO: COMPACT, BALANCED ASYMMETRIC GRID           */}
      {/* ============================================================== */}
      <div className={styles.mainBentoGrid}>
        {/* TILE A: TODAY'S ACTION HUB (Compact Hero Tile) */}
        <div
          className={`${styles.actionHubTile} ${
            isAvailableToClaim ? styles.actionHubAvailable : ''
          } ${isActiveClaimed ? styles.actionHubClaimed : ''}`}
        >
          {/* Ambient Lighting Background */}
          <div className={styles.actionHubAura} />

          {/* Header Row: Day Pill + Honest Status Badge */}
          <div className={styles.actionHubHeader}>
            <div className={styles.dayIndicatorPill}>
              <span>Day {activeDay}</span>
            </div>

            {isActiveClaimed ? (
              <span className={styles.statusPillClaimed}>
                <Check size={11} strokeWidth={3} />
                <span>Claimed</span>
              </span>
            ) : isAvailableToClaim ? (
              <span className={styles.statusPillAvailable}>
                <Sparkles size={11} />
                <span>Ready to Claim</span>
              </span>
            ) : isCooldownActive && !countdown.isExpired ? (
              <span className={styles.statusPillCooldown}>
                <Clock size={11} />
                <span>Cooldown Active</span>
              </span>
            ) : (
              <span className={styles.statusPillLocked}>
                <Lock size={10} />
                <span>Locked</span>
              </span>
            )}
          </div>

          {/* Center Composition: Compact Artwork + Crisp Typography */}
          <div className={styles.actionHubBody}>
            <div className={styles.artworkWrapper}>
              <img
                src={activeAsset.src}
                alt={activeAsset.alt}
                className={`${styles.hubArtworkImg} ${
                  activeAsset.type === 'amazon'
                    ? styles.artworkAmazon
                    : activeAsset.type === 'crown'
                    ? styles.artworkCrown
                    : activeAsset.type === 'giftbox'
                    ? styles.artworkGiftbox
                    : styles.artworkCoin
                }`}
              />
            </div>

            <div className={styles.valueDetails}>
              <div className={styles.rewardBigTitle}>
                {formatRewardTitle(activeReward)}
              </div>
              <p className={styles.rewardSubtitle}>
                {activeReward?.reward?.type === 'VES'
                  ? 'Instant VELoop Virtual Economy Wallet Credit'
                  : 'Official Amazon Voucher • Delivered to Account'}
              </p>
            </div>
          </div>

          {/* Action Area: Sleek Centered Button OR Honest Cooldown Countdown */}
          <div className={styles.actionHubFooter}>
            {isActiveClaimed ? (
              <div className={styles.claimedSuccessBar}>
                <CheckCircle2 size={16} className={styles.emeraldCheckIcon} />
                <span>Day {activeDay} Reward Claimed & Credited to Wallet</span>
              </div>
            ) : isAvailableToClaim ? (
              <button
                type="button"
                className={styles.claimHeroBtn}
                onClick={onClaim}
                disabled={isClaiming}
              >
                {isClaiming ? (
                  <>
                    <Loader2 size={16} className="spinner-border spinner-border-sm" />
                    <span>Verifying & Claiming...</span>
                  </>
                ) : (
                  <>
                    <span>Claim Reward ({formatRewardTitle(activeReward)})</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            ) : isCooldownActive && !countdown.isExpired ? (
              <div className={styles.lockedCooldownBar}>
                <Clock size={15} className={styles.clockIconAmber} />
                <span>Next claim unlocks in <strong>{countdown.formatted}</strong></span>
              </div>
            ) : (
              <div className={styles.lockedFutureBar}>
                <Lock size={13} />
                <span>Day {activeDay} unlocks on your next daily check-in</span>
              </div>
            )}
          </div>
        </div>

        {/* TILE B: DAY 7 ULTIMATE VAULT SHOWCASE (Compact VIP Tile) */}
        <div className={styles.vaultTile}>
          <div className={styles.vaultGoldAura} />

          <div className={styles.vaultBadgeRow}>
            <span className={styles.vipPillBadge}>
              <Sparkles size={11} /> VIP Finale
            </span>
            <span className={styles.day7Badge}>Day 7</span>
          </div>

          <div className={styles.vaultCrownBox}>
            <img
              src="/assets/daily-streak/Day-7.png"
              alt="Ultimate Crown Reward"
              className={styles.vaultCrownImg}
            />
          </div>

          <div className={styles.vaultInfo}>
            <div className={styles.vaultAmount}>₹5 Amazon Card</div>
            <div className={styles.amazonBadgePill}>
              <span className={styles.amazonCircleA}>a</span>
              <span>Amazon Gift Card</span>
            </div>
          </div>

          {/* Mini Gold Progress Bar toward Day 7 */}
          <div className={styles.vaultProgressBox}>
            <div className={styles.vaultProgressTrack}>
              <div
                className={styles.vaultProgressFill}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className={styles.vaultProgressMeta}>
              <span>Progress</span>
              <span>{checkedIn} / 7 Days</span>
            </div>
          </div>

          <div className={styles.vaultFooterStatus}>
            {day7Status === 'CLAIMED' ? (
              <span className={styles.vaultClaimedTag}>
                <Check size={13} strokeWidth={3} /> Claimed
              </span>
            ) : (
              <span className={styles.vaultLockNotice}>
                <Lock size={12} /> {7 - checkedIn > 0 ? `${7 - checkedIn} days remaining` : 'Ready to claim'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. BOTTOM BENTO ROW: 7-DAY INTERACTIVE TIMELINE RIBBON          */}
      {/* ============================================================== */}
      <div className={styles.ribbonSection}>
        <div className={styles.ribbonHeaderRow}>
          <div className={styles.ribbonTitleGroup}>
            <h3 className={styles.ribbonHeading}>7-Day Reward Schedule</h3>
            <span className={styles.ribbonSubheading}>
              Tap any day to preview its reward details
            </span>
          </div>
        </div>

        <div className={styles.timelineRibbon}>
          {rewards.map((rewardItem) => {
            const dayNum = rewardItem.day;
            const isItemClaimed = rewardItem.status === 'CLAIMED';
            const isItemAvailable = rewardItem.status === 'AVAILABLE';
            const isCurrentActiveSelected = dayNum === activeDay;
            const itemAsset = getAssetInfo(dayNum);
            const isDay7 = dayNum === 7;

            return (
              <button
                key={`timeline-day-${dayNum}`}
                type="button"
                onClick={() => setSelectedDayNumber(dayNum)}
                className={`${styles.timelineNode} ${
                  isCurrentActiveSelected ? styles.nodeSelected : ''
                } ${isItemClaimed ? styles.nodeClaimed : ''} ${
                  isItemAvailable ? styles.nodeAvailable : ''
                } ${isDay7 ? styles.nodeDay7 : ''}`}
                aria-label={`View Day ${dayNum} reward: ${rewardItem.title}`}
              >
                {/* Day Header Badge */}
                <div className={styles.nodeTopRow}>
                  <span className={styles.nodeDayText}>D{dayNum}</span>
                  {isItemClaimed ? (
                    <span className={styles.nodeCheckIcon}>
                      <Check size={10} strokeWidth={3.5} />
                    </span>
                  ) : isItemAvailable ? (
                    <span className={styles.nodeLiveDot} />
                  ) : (
                    <span className={styles.nodeLockIcon}>
                      <Lock size={9} />
                    </span>
                  )}
                </div>

                {/* Micro Artwork Icon */}
                <div className={styles.nodeAssetWrapper}>
                  <img
                    src={itemAsset.src}
                    alt={itemAsset.alt}
                    className={`${styles.nodeImg} ${
                      itemAsset.type === 'amazon'
                        ? styles.nodeImgAmazon
                        : itemAsset.type === 'crown'
                        ? styles.nodeImgCrown
                        : styles.nodeImgCoin
                    }`}
                  />
                </div>

                {/* Amount Pill — Clean, strictly prevents ++ formatting bug */}
                <span
                  className={`${styles.nodeValue} ${
                    isItemClaimed
                      ? styles.nodeValueGreen
                      : isDay7 || isItemAvailable
                      ? styles.nodeValueGold
                      : styles.nodeValueMuted
                  }`}
                >
                  {formatTimelineValue(rewardItem)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BentoStreakHub;
