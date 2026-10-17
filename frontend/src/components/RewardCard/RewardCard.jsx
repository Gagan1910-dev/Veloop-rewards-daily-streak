import React from 'react';
import { Check, Lock, ChevronRight, Loader2 } from 'lucide-react';
import { useCountdown } from '../../hooks/useCountdown.js';
import styles from './RewardCard.module.css';

const RewardCard = ({
  rewardData,
  isClaiming,
  onClaim,
  onCountdownExpire
}) => {
  const {
    day,
    title,
    reward,
    metadata,
    status,
    isActionableToday,
    nextClaimAt
  } = rewardData;

  const countdown = useCountdown(nextClaimAt, onCountdownExpire);

  // Asset image path
  let assetPath = '/assets/daily-streak/VEs_Coin.png';
  let assetType = 'coin';
  if (day === 4) {
    assetPath = '/assets/daily-streak/Day-4.png';
    assetType = 'giftbox';
  } else if (day === 5) {
    assetPath = '/assets/daily-streak/Day-5.png';
    assetType = 'amazon-card';
  } else if (day === 7) {
    assetPath = '/assets/daily-streak/Day-7.png';
    assetType = 'crown';
  }

  const isAvailable = status === 'AVAILABLE' || isActionableToday;
  const isClaimed = status === 'CLAIMED';
  const isLocked = status === 'LOCKED';
  const isDay7 = day === 7;

  // Badge mapping matching official design:
  let badgeText = null;
  if (isDay7) {
    badgeText = 'VIP';
  } else if (day === 5) {
    badgeText = 'Gift';
  } else if (day === 6) {
    badgeText = 'Coin';
  } else if (isAvailable) {
    badgeText = 'Today';
  } else if (metadata?.badge && metadata.badge !== 'Today') {
    badgeText = metadata.badge;
  }

  let badgeClass = '';
  if (badgeText === 'Today') badgeClass = styles.badgeToday;
  else if (badgeText === 'Gift') badgeClass = styles.badgeGift;
  else if (badgeText === 'Coin') badgeClass = styles.badgeCoin;
  else if (badgeText === 'VIP' || isDay7) badgeClass = styles.badgeVip;

  // Custom asset size class based on asset type and day
  const assetSizeClass =
    assetType === 'amazon-card'
      ? styles.assetAmazonCard
      : assetType === 'crown'
      ? styles.assetCrown
      : assetType === 'giftbox'
      ? styles.assetGiftbox
      : day === 6
      ? styles.assetCoinLg
      : day === 3
      ? styles.assetCoinMd
      : day === 2
      ? styles.assetCoinSm
      : styles.assetCoinXs;

  // Amount color mapping
  let amountColorClass = styles.amountGold;
  if (isClaimed) {
    amountColorClass = styles.amountGreen;
  } else if (day === 1) {
    amountColorClass = styles.amountGreen;
  } else if (day === 2) {
    amountColorClass = styles.amountGold;
  } else if (day === 3) {
    amountColorClass = styles.amountViolet;
  } else if (day === 4 || day === 5) {
    amountColorClass = styles.amountCyan;
  } else if (day === 6) {
    amountColorClass = styles.amountViolet;
  } else if (day === 7) {
    amountColorClass = styles.amountGold;
  }

  const isVes = reward?.type === 'VES';
  const displayTitle = isVes
    ? `${title.startsWith('+') ? title : `+${title}`} VEs`
    : title;

  return (
    <div
      className={`${styles.cardWrapper} ${
        isDay7 ? styles.cardDay7Vip : ''
      } ${isAvailable ? styles.cardAvailable : ''} ${
        isClaimed ? styles.cardClaimed : ''
      }`}
    >
      {/* Header with Day Capsule and Optional Badge / Claimed check */}
      <div className={styles.headerRow}>
        <span className={styles.dayNumber}>Day {day}</span>
        {isClaimed ? (
          <span className={styles.headerClaimedCheck} title="Claimed">
            <Check size={11} strokeWidth={3.5} />
          </span>
        ) : badgeText ? (
          <span className={`${styles.badgePill} ${badgeClass}`}>{badgeText}</span>
        ) : null}
      </div>

      {/* Asset Image Container - Centered, Vibrant & Proportional */}
      <div className={styles.assetContainer}>
        <img
          src={assetPath}
          alt={`Day ${day} ${reward?.type || 'Reward'}`}
          className={`${styles.rewardAsset} ${assetSizeClass}`}
        />
      </div>

      {/* Reward Details - Clean, Single High-Impact Title & Subtype */}
      <div className={styles.rewardDetails}>
        <h4 className={`${styles.amountTitle} ${amountColorClass}`}>
          {displayTitle}
        </h4>
        {!isVes && (
          <span className={styles.rewardSubtype}>Amazon Card</span>
        )}
      </div>

      {/* Action CTA Button */}
      {isClaimed && (
        <div className={`${styles.btnBase} ${styles.btnClaimed}`}>
          <Check size={13} strokeWidth={3} />
          <span>Claimed</span>
        </div>
      )}

      {isAvailable && (
        <button
          type="button"
          className={`${styles.btnBase} ${styles.btnClaimNow}`}
          onClick={onClaim}
          disabled={isClaiming}
        >
          {isClaiming ? (
            <>
              <Loader2 size={12} className="spinner-border spinner-border-sm" />
              <span>Claiming...</span>
            </>
          ) : (
            <>
              <span className={styles.btnTextDesktop}>Claim Reward</span>
              <span className={styles.btnTextMobile}>Claim</span>
              <ChevronRight size={13} className={styles.btnChevron} />
            </>
          )}
        </button>
      )}

      {isLocked && (
        <div className={`${styles.btnBase} ${styles.btnLocked}`}>
          <Lock size={11} />
          {nextClaimAt && !countdown.isExpired ? (
            <span className={styles.countdownDisplay}>{countdown.formatted}</span>
          ) : (
            <span>Locked</span>
          )}
        </div>
      )}
    </div>
  );
};

export default RewardCard;
