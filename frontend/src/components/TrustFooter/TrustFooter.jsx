import React from 'react';
import { ChevronRight } from 'lucide-react';
import styles from './TrustFooter.module.css';

const TrustFooter = () => {
  return (
    <footer className={styles.footerContainer}>
      <div className={styles.trustBar}>
        <div className={styles.leftGroup}>
          <div className={styles.vrBadgeCircle}>
            <span className={styles.vrText}>VR</span>
          </div>

          <div className={styles.textGroup}>
            <span className={styles.officialTitle}>
              Official rewards only on{' '}
              <strong className={styles.goldDomain}>VeloopRewards.in</strong>
            </span>
            <span className={styles.dividerPipe}>|</span>
            <span className={styles.tagline}>Stay active, stay rewarded!</span>
          </div>
        </div>

        <div className={styles.mobileArrow}>
          <ChevronRight size={18} />
        </div>
      </div>
    </footer>
  );
};

export default TrustFooter;

