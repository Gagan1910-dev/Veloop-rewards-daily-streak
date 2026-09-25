import React from 'react';
import { Calendar, Gift, CheckCircle2, Star, ChevronRight } from 'lucide-react';
import styles from './StreakStats.module.css';

const StreakStats = ({ streakData, nextReward, onOpenCalendar }) => {
  const currentStreak = streakData?.currentStreak ?? 0;
  const checkedIn = streakData?.checkedIn ?? 0;
  const totalRewards = streakData?.totalRewards ?? 7;

  // Format Next Reward cleanly without duplicating numbers (e.g., "+10 VEs" instead of "+10 10 VEs")
  const formatRewardDisplay = (reward) => {
    if (!reward) return '+10 VEs';
    const title = reward.title || '';
    const subtitle = reward.subtitle || '';

    if (subtitle.includes('VEs')) {
      return `${title.startsWith('+') ? title : `+${title}`} VEs`;
    }
    return `${title} ${subtitle}`.trim() || '+10 VEs';
  };

  const nextRewardTitle = formatRewardDisplay(nextReward);

  return (
    <section className={styles.statsSection}>
      <div className={styles.topBar}>
        <div className={styles.streakBadge}>
          <img
            src="/assets/daily-streak/Flame.png"
            alt="Streak Flame"
            className={styles.flameSmall}
          />
          <span>{currentStreak} Day Streak</span>
        </div>

        <button
          type="button"
          className={styles.calendarLink}
          onClick={onOpenCalendar}
          aria-label="Open Streak Calendar and Check-In History"
        >
          <Calendar size={16} />
          <span>Streak Calendar</span>
          <ChevronRight size={14} />
        </button>
      </div>

      <div className={styles.statsGrid}>
        {/* Total Rewards */}
        <div className={styles.statCard}>
          <div className={`${styles.iconWrapper} ${styles.purpleIcon}`}>
            <Gift size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Total Rewards</span>
            <span className={styles.statValue}>{totalRewards}</span>
          </div>
        </div>

        {/* Checked In */}
        <div className={styles.statCard}>
          <div className={`${styles.iconWrapper} ${styles.greenIcon}`}>
            <CheckCircle2 size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Checked In</span>
            <span className={styles.statValue}>{checkedIn}</span>
          </div>
        </div>

        {/* Next Reward */}
        <div className={styles.statCard}>
          <div className={`${styles.iconWrapper} ${styles.goldIcon}`}>
            <Star size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Next Reward</span>
            <span className={`${styles.statValue} ${styles.goldValue}`}>{nextRewardTitle}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StreakStats;
