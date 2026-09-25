import React from 'react';
import { ChevronRight } from 'lucide-react';
import styles from './TrustFooter.module.css';

const TrustFooter = () => {
  return (
    <footer className={styles.footerContainer}>
      <div className={styles.trustBar}>
        <div className={styles.leftGroup}>
          <div className={styles.brandBadge}>VR</div>
          <div className={styles.textGroup}>
            <span className={styles.officialTitle}>
              Official rewards only on VeloopRewards.in
            </span>
            <span className={styles.tagline}>Stay active, stay rewarded!</span>
          </div>
        </div>

        <ChevronRight size={20} className={styles.arrowIcon} />
      </div>
    </footer>
  );
};

export default TrustFooter;
