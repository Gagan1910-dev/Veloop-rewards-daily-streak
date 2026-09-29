import React from 'react';
import styles from './StreakSkeleton.module.css';

/**
 * Premium VELoop Daily Streak Skeleton Loader
 * Mirrored 1-to-1 with actual DailyStreakPage structure:
 * - Hero Banner placeholder
 * - Stats Metric Bar placeholder
 * - Ultimate Day 7 Reward placeholder
 * - 7-Day Reward Card Grid (4 + 3 layout)
 */
const StreakSkeleton = () => {
  return (
    <div className={styles.skeletonContainer} aria-hidden="true" role="status">
      {/* 1. Hero Banner Skeleton */}
      <div className={`${styles.shimmerBox} ${styles.heroBannerSkeleton}`}>
        <div className={styles.heroTextGroup}>
          <div className={`${styles.shimmerLine} ${styles.heroTitleSkeleton}`} />
          <div className={`${styles.shimmerLine} ${styles.heroSubSkeleton}`} />
        </div>
        <div className={styles.heroArtworkSkeleton} />
      </div>

      {/* 2. 7-Day Journey Track Skeleton */}
      <div className={`${styles.shimmerBox} ${styles.journeySkeleton}`}>
        <div className={`${styles.shimmerLine} ${styles.journeyHeaderSkeleton}`} />
        <div className={styles.journeyTrackSkeletonRow}>
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className={styles.journeyNodeSkeleton} />
          ))}
        </div>
      </div>

      {/* 3. Stats Bar Skeleton */}
      <div className={`${styles.shimmerBox} ${styles.statsBarSkeleton}`}>
        <div className={`${styles.shimmerPill} ${styles.statPillSkeleton}`} />
        <div className={`${styles.shimmerPill} ${styles.statPillSkeleton}`} />
        <div className={`${styles.shimmerPill} ${styles.statPillSkeleton}`} />
      </div>

      {/* 4. Ultimate Reward Banner Skeleton */}
      <div className={`${styles.shimmerBox} ${styles.ultimateBannerSkeleton}`}>
        <div className={styles.ultimateLeft}>
          <div className={styles.ultimateIconSkeleton} />
          <div className={styles.ultimateTextGroup}>
            <div className={`${styles.shimmerLine} ${styles.ultimateLabelSkeleton}`} />
            <div className={`${styles.shimmerLine} ${styles.ultimateAmountSkeleton}`} />
          </div>
        </div>
        <div className={`${styles.shimmerPill} ${styles.ultimatePillSkeleton}`} />
      </div>

      {/* 4. Sub-banner Notice */}
      <div className={`${styles.shimmerLine} ${styles.subBannerSkeleton}`} />

      {/* 5. 7-Day Cards Grid (Top 4, Bottom 3) */}
      <div className={styles.gridSection}>
        <div className={styles.topRowGrid}>
          {[1, 2, 3, 4].map((day) => (
            <div key={day} className={`${styles.shimmerBox} ${styles.cardSkeleton}`}>
              <div className={styles.cardHeader}>
                <div className={`${styles.shimmerLine} ${styles.cardDaySkeleton}`} />
                {day === 1 && <div className={`${styles.shimmerPill} ${styles.cardBadgeSkeleton}`} />}
              </div>
              <div className={styles.cardIconSkeleton} />
              <div className={`${styles.shimmerLine} ${styles.cardTypeSkeleton}`} />
              <div className={`${styles.shimmerLine} ${styles.cardAmountSkeleton}`} />
              <div className={`${styles.shimmerBox} ${styles.cardBtnSkeleton}`} />
            </div>
          ))}
        </div>

        <div className={styles.bottomRowGrid}>
          {[5, 6, 7].map((day) => (
            <div key={day} className={`${styles.shimmerBox} ${styles.cardSkeleton}`}>
              <div className={styles.cardHeader}>
                <div className={`${styles.shimmerLine} ${styles.cardDaySkeleton}`} />
                {day === 7 && <div className={`${styles.shimmerPill} ${styles.cardBadgeSkeleton}`} />}
              </div>
              <div className={styles.cardIconSkeleton} />
              <div className={`${styles.shimmerLine} ${styles.cardTypeSkeleton}`} />
              <div className={`${styles.shimmerLine} ${styles.cardAmountSkeleton}`} />
              <div className={`${styles.shimmerBox} ${styles.cardBtnSkeleton}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StreakSkeleton;
