import React from 'react';
import { Calendar, Gift, CheckCircle2, Star, ChevronRight, Check, Lock } from 'lucide-react';
import styles from './StreakStats.module.css';

const StreakStats = ({ streakData, nextReward, rewards = [], onOpenCalendar }) => {
  const currentStreak = streakData?.currentStreak ?? 0;
  const checkedIn = streakData?.checkedIn ?? 0;
  const totalRewards = streakData?.totalRewards ?? 7;
  const currentDay = streakData?.currentDay ?? 1;

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

  // Asset helper for Journey nodes
  const getAssetForDay = (day) => {
    if (day === 4) return '/assets/daily-streak/Day-4.png';
    if (day === 5) return '/assets/daily-streak/Day-5.png';
    if (day === 7) return '/assets/daily-streak/Day-7.png';
    return '/assets/daily-streak/VEs_Coin.png';
  };

  // 7-day sequence
  const journeyDays = Array.from({ length: 7 }, (_, i) => {
    const dayNum = i + 1;
    const rewardInfo = rewards.find((r) => r.day === dayNum);
    const status = rewardInfo?.status || (dayNum < currentDay ? 'CLAIMED' : dayNum === currentDay ? 'AVAILABLE' : 'LOCKED');
    return {
      day: dayNum,
      status,
      asset: getAssetForDay(dayNum),
      title: rewardInfo?.title || (dayNum === 7 ? '₹5 Amazon' : dayNum === 4 ? '₹1 Amazon' : dayNum === 5 ? '₹2 Amazon' : `Day ${dayNum}`)
    };
  });

  return (
    <section className={styles.statsSection}>
      <div className={styles.topBar}>
        <div className={styles.streakBadge}>
          <img
            src="/assets/daily-streak/Flame.png"
            alt="Streak Flame"
            className={styles.flameSmall}
          />
          <div className={styles.streakBadgeContent}>
            <span className={styles.streakCountText}>{currentStreak} Day Streak</span>
            <span className={styles.streakSubText}>Keep it going daily!</span>
          </div>
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

      {/* 7-Day Visual Progress Journey Track */}
      <div className={styles.journeyCard}>
        <div className={styles.journeyHeader}>
          <div className={styles.journeyTitleRow}>
            <span className={styles.journeyTitle}>7-Day Reward Journey</span>
            <span className={styles.journeySubtitle}>
              {checkedIn} of 7 Days Claimed
            </span>
          </div>
          <div className={styles.progressTrackOuter}>
            <div
              className={styles.progressTrackFill}
              style={{ width: `${Math.min(100, (checkedIn / 7) * 100)}%` }}
            />
          </div>
        </div>

        <div className={styles.journeyNodesRow}>
          {journeyDays.map((node) => {
            const isCompleted = node.status === 'CLAIMED';
            const isCurrent = node.status === 'AVAILABLE' || node.day === currentDay;
            const isLocked = node.status === 'LOCKED';

            return (
              <div
                key={node.day}
                className={`${styles.journeyNodeWrapper} ${
                  isCompleted ? styles.nodeCompleted : ''
                } ${isCurrent ? styles.nodeCurrent : ''} ${
                  isLocked ? styles.nodeLocked : ''
                }`}
              >
                <div className={styles.nodeCircle}>
                  <img
                    src={node.asset}
                    alt={`Day ${node.day} Reward`}
                    className={`${styles.nodeAssetImg} ${node.day === 7 ? styles.nodeCrownImg : ''}`}
                  />
                  {isCompleted && (
                    <div className={styles.nodeStatusBadge}>
                      <Check size={11} strokeWidth={3} />
                    </div>
                  )}
                  {isLocked && (
                    <div className={styles.nodeLockBadge}>
                      <Lock size={10} strokeWidth={2.5} />
                    </div>
                  )}
                </div>
                <span className={styles.nodeDayLabel}>Day {node.day}</span>
                <span className={styles.nodeTitleLabel}>
                  {node.day === 7 ? '👑 ₹5' : node.day === 4 || node.day === 5 ? `₹${node.day === 4 ? '1' : '2'}` : `+${node.day === 1 ? 5 : node.day === 2 ? 10 : node.day === 3 ? 15 : 30}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.statsGrid}>
        {/* Total Rewards */}
        <div className={styles.statCard}>
          <div className={`${styles.iconWrapper} ${styles.purpleIcon}`}>
            <Gift size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Total Rewards</span>
            <span className={styles.statValue}>{totalRewards} Days</span>
          </div>
        </div>

        {/* Checked In */}
        <div className={styles.statCard}>
          <div className={`${styles.iconWrapper} ${styles.greenIcon}`}>
            <CheckCircle2 size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Checked In</span>
            <span className={styles.statValue}>{checkedIn} / 7 Days</span>
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
