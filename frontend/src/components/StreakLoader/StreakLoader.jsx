import React from 'react';
import styles from './StreakLoader.module.css';

/**
 * Premium VELoop Rewards Loading Animation
 * Features glowing energy rings, orbiting reward nodes, breathing flame core, and luxury shimmer typography.
 */
const StreakLoader = ({
  message = 'Loading your streak...',
  subMessage = 'Syncing server rewards & ledger...'
}) => {
  return (
    <div className={styles.loaderBackdrop} role="status" aria-live="polite" aria-label={message}>
      {/* Background Ambient Aura */}
      <div className={styles.ambientGlow} />

      {/* Central Interactive Crucible */}
      <div className={styles.crucibleContainer}>
        {/* Outer Orbiting Energy Ring */}
        <div className={styles.orbitRingOuter}>
          <div className={`${styles.orbitNode} ${styles.goldNode}`} title="Gold Reward Node" />
          <div className={`${styles.orbitNode} ${styles.emeraldNode}`} title="Emerald Reward Node" />
        </div>

        {/* Inner Counter-Rotating Ring */}
        <div className={styles.orbitRingInner}>
          <div className={`${styles.orbitNode} ${styles.violetNode}`} title="Violet Gem Node" />
        </div>

        {/* Central Core Glass Chamber */}
        <div className={styles.coreChamber}>
          <div className={styles.corePulseAura} />
          <img
            src="/assets/daily-streak/Flame.png"
            alt="VELoop Streak Flame"
            className={styles.coreFlame}
          />
        </div>
      </div>

      {/* Loading Information & Shimmer Typography */}
      <div className={styles.textContainer}>
        <h2 className={styles.titleShimmer}>{message}</h2>
        <div className={styles.statusPill}>
          <span className={styles.pulseDot} />
          <span className={styles.subText}>{subMessage}</span>
        </div>
      </div>
    </div>
  );
};

export default StreakLoader;
