import React from 'react';
import styles from './StreakSkeleton.module.css';

const StreakSkeleton = () => {
  return (
    <div className={styles.skeletonWrapper}>
      <div className={`${styles.shimmer} ${styles.heroSkeleton}`} />
      <div className={`${styles.shimmer} ${styles.statsSkeleton}`} />
      <div className={`${styles.shimmer} ${styles.ultimateSkeleton}`} />
      <div className={styles.cardsGridSkeleton}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`${styles.shimmer} ${styles.cardSkeleton}`} />
        ))}
      </div>
    </div>
  );
};

export default StreakSkeleton;
