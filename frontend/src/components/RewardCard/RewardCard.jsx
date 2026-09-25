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
    subtitle,
    reward,
    metadata,
    status,
    isActionableToday,
    nextClaimAt
  } = rewardData;

  const countdown = useCountdown(nextClaimAt, onCountdownExpire);

  // Determine asset image
  let assetPath = '/assets/daily-streak/VEs_Coin.png';
  if (day === 4) assetPath = '/assets/daily-streak/Day-4.png';
  else if (day === 5) assetPath = '/assets/daily-streak/Day-5.png';
  else if (day === 7) assetPath = '/assets/daily-streak/Day-7.png';

  const isAvailable = status === 'AVAILABLE';
  const isClaimed = status === 'CLAIMED';
  const isLocked = status === 'LOCKED';

  // Badge mapping
  const badgeText = metadata?.badge;
  let badgeClass = '';
  if (badgeText === 'Today') badgeClass = styles.badgeToday;
  else if (badgeText === 'Gift Card') badgeClass = styles.badgeGift;
  else if (badgeText === 'Coin') badgeClass = styles.badgeCoin;
  else if (badgeText === 'VIP') badgeClass = styles.badgeVip;

  return (
    <div
      className={`${styles.cardWrapper} ${isAvailable ? styles.cardAvailable : ''} ${
        isClaimed ? styles.cardClaimed : ''
      }`}
    >
      {/* Header with Day and Optional Badge */}
      <div className={styles.headerRow}>
        <span className={styles.dayNumber}>Day {day}</span>
        {badgeText && <span className={`${styles.badgePill} ${badgeClass}`}>{badgeText}</span>}
      </div>

      {/* Asset Image */}
      <div className={styles.assetContainer}>
        <img src={assetPath} alt={`Day ${day} Reward`} className={styles.rewardAsset} />
      </div>

      {/* Reward Details */}
      <span className={styles.rewardTypeLabel}>
        {reward?.type === 'GIFT_CARD' ? 'Daily Reward' : 'Daily Reward'}
      </span>

      <h4
        className={`${styles.amountTitle} ${isClaimed ? styles.amountGreen : ''} ${
          isAvailable ? styles.amountGold : ''
        }`}
      >
        {title}
      </h4>

      <p className={styles.subtitle}>{subtitle || (reward?.type === 'VES' ? `${reward.amount} VEs` : '')}</p>

      {/* Action CTA Button */}
      {isClaimed && (
        <div className={`${styles.btnBase} ${styles.btnClaimed}`}>
          <Check size={16} />
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
              <Loader2 size={16} className="spinner-border spinner-border-sm" />
              <span>Claiming...</span>
            </>
          ) : (
            <>
              <span>Claim Now</span>
              <ChevronRight size={16} />
            </>
          )}
        </button>
      )}

      {isLocked && (
        <div className={`${styles.btnBase} ${styles.btnLocked}`}>
          <Lock size={14} />
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
