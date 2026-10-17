import React from 'react';
import { Calendar, CheckSquare, Star, ChevronRight, Lock, Check } from 'lucide-react';
import styles from './HeroBanner.module.css';

const HeroBanner = ({
  streakData,
  nextReward,
  ultimateReward,
  day7Status,
  onOpenCalendar
}) => {
  const currentStreak = streakData?.currentStreak ?? 1;
  const checkedIn = streakData?.checkedIn ?? 1;
  const totalRewards = streakData?.totalRewards ?? 7;

  // Format Next Reward cleanly e.g. "+10 VEs"
  const formatRewardDisplay = (reward) => {
    if (!reward) return '+10 VEs';
    const title = reward.title || '';
    const subtitle = reward.subtitle || '';
    if (subtitle.includes('VEs')) {
      return `${title.startsWith('+') ? title : `+${title}`} VEs`;
    }
    return `${title} ${subtitle}`.trim() || '+10 VEs';
  };

  const nextRewardDisplay = formatRewardDisplay(nextReward);
  const ultimateTitle = ultimateReward?.title || '₹5';
  const ultimateSubtitle = ultimateReward?.subtitle || 'Amazon Gift Card';
  const day7IsClaimed = day7Status === 'CLAIMED';

  return (
    <section className={styles.heroSection}>
      {/* ============================================================== */}
      {/* DESKTOP UNIFIED HERO COMPOSITION (Matches ref_desktop.jpg)     */}
      {/* ============================================================== */}
      <div className={styles.desktopHeroCard}>
        {/* Left: Purple Gift Box + VR Coins Asset */}
        <div className={styles.leftVisualCol}>
          <img
            src="/assets/daily-streak/Top_Left.png"
            alt="Daily Streak Gift Box and Coins"
            className={styles.topLeftImg}
          />
        </div>

        {/* Center: Title & 3 Stat Pills */}
        <div className={styles.centerContentCol}>
          <h2 className={styles.centerSmallTitle}>Daily Check-In</h2>
          <h1 className={styles.centerRewardsHeading}>Rewards</h1>
          <p className={styles.centerSubtitle}>
            Check in every day and earn exciting rewards!
          </p>

          {/* 3 Stats Pills row beneath center text */}
          <div className={styles.statsPillsRow}>
            {/* Total Rewards */}
            <div className={styles.statPillItem}>
              <div className={styles.statIconSquarePurple}>
                <Calendar size={17} strokeWidth={2.4} />
              </div>
              <div className={styles.statPillText}>
                <span className={styles.statPillLabel}>Total Rewards</span>
                <span className={styles.statPillValue}>{totalRewards}</span>
              </div>
            </div>

            {/* Checked In */}
            <div className={styles.statPillItem}>
              <div className={styles.statIconSquareGreen}>
                <CheckSquare size={17} strokeWidth={2.4} />
              </div>
              <div className={styles.statPillText}>
                <span className={styles.statPillLabel}>Checked In</span>
                <span className={styles.statPillValue}>{checkedIn}</span>
              </div>
            </div>

            {/* Next Reward */}
            <div className={styles.statPillItem}>
              <div className={styles.statIconCircleGold}>
                <Star size={16} fill="#fbbf24" strokeWidth={0} />
              </div>
              <div className={styles.statPillText}>
                <span className={styles.statPillLabel}>Next Reward</span>
                <span className={styles.statPillValueGold}>{nextRewardDisplay}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Ultimate Reward Section & Crown Artwork */}
        <div className={styles.rightUltimateCol}>
          <div className={styles.crownImgWrapper}>
            <img
              src="/assets/daily-streak/Top_right.png"
              alt="Ultimate Crown Reward"
              className={styles.topRightCrownImg}
            />
          </div>

          <div className={styles.ultimateDetailsBlock}>
            <span className={styles.ultimateSectionLabel}>Ultimate Reward</span>
            <div className={styles.ultimateAmountHeading}>{ultimateTitle}</div>
            <div className={styles.amazonBadgePill}>
              <span className={styles.amazonLogoCircle}>a</span>
              <span>{ultimateSubtitle}</span>
            </div>
            <span className={styles.unlockDay7Notice}>
              {day7IsClaimed ? '✓ Claimed' : 'Unlock on Day 7'}
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MOBILE RESPONSIVE HERO STACK (Matches ref_mobile.jpg)          */}
      {/* ============================================================== */}
      <div className={styles.mobileHeroStack}>
        {/* 1. Mobile Graphic Banner without duplicate HTML text */}
        <div className={styles.mobileHeroBannerCard}>
          <img
            src="/assets/daily-streak/Mobile_Hero.png"
            alt="Login Daily & Earn Bigger Rewards"
            className={styles.mobileHeroImg}
          />
        </div>

        {/* 2. Streak Badge & Streak Calendar quick link bar */}
        <div className={styles.mobileQuickBar}>
          <div className={styles.mobileStreakPill}>
            <img
              src="/assets/daily-streak/Flame.png"
              alt="Streak Flame"
              className={styles.mobileFlameIcon}
            />
            <span>{currentStreak} Day Streak</span>
          </div>

          {onOpenCalendar && (
            <button
              type="button"
              className={styles.mobileCalendarPill}
              onClick={onOpenCalendar}
              aria-label="Open Streak Calendar"
            >
              <Calendar size={15} />
              <span>Streak Calendar</span>
              <ChevronRight size={14} />
            </button>
          )}
        </div>

        {/* 3. Three Stats Cards */}
        <div className={styles.mobileStatsGrid}>
          <div className={styles.mobileStatCard}>
            <div className={styles.statIconSquarePurple}>
              <Calendar size={15} strokeWidth={2.4} />
            </div>
            <div className={styles.statPillText}>
              <span className={styles.statPillLabel}>Total Rewards</span>
              <span className={styles.statPillValue}>{totalRewards}</span>
            </div>
          </div>

          <div className={styles.mobileStatCard}>
            <div className={styles.statIconSquareGreen}>
              <CheckSquare size={15} strokeWidth={2.4} />
            </div>
            <div className={styles.statPillText}>
              <span className={styles.statPillLabel}>Checked In</span>
              <span className={styles.statPillValue}>{checkedIn}</span>
            </div>
          </div>

          <div className={styles.mobileStatCard}>
            <div className={styles.statIconCircleGold}>
              <Star size={15} fill="#fbbf24" strokeWidth={0} />
            </div>
            <div className={styles.statPillText}>
              <span className={styles.statPillLabel}>Next Reward</span>
              <span className={styles.statPillValueGold}>{nextRewardDisplay}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
