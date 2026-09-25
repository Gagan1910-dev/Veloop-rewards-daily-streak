import React from 'react';
import styles from './StreakLoader.module.css';

const StreakLoader = ({ message = 'Loading your streak...' }) => {
  return (
    <div className={styles.loaderContainer}>
      <div className={styles.flameWrapper}>
        <div className={styles.flameGlow} />
        <img
          src="/assets/daily-streak/Flame.png"
          alt="VELoop Fire"
          className={styles.flameImg}
        />
      </div>
      <h3 className={styles.loadingText}>{message}</h3>
      <span className={styles.subText}>Syncing server rewards...</span>
    </div>
  );
};

export default StreakLoader;
