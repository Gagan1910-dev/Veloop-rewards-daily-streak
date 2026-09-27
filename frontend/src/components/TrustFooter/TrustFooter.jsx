import React from 'react';
import { ChevronRight, ShieldCheck } from 'lucide-react';
import styles from './TrustFooter.module.css';

const TrustFooter = () => {
  return (
    <footer className={styles.footerContainer}>
      <a
        href="https://velooprewards.in"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.trustBar}
        title="Visit official VELoop Rewards portal"
        aria-label="Visit official VELoop Rewards portal at VeloopRewards.in"
      >
        <div className={styles.leftGroup}>
          <div className={styles.brandBadge}>VR</div>
          <div className={styles.textGroup}>
            <div className={styles.titleRow}>
              <span className={styles.officialTitle}>
                Official rewards only on VeloopRewards.in
              </span>
              <ShieldCheck size={14} className={styles.verifiedIcon} />
            </div>
            <span className={styles.tagline}>Stay active, stay rewarded!</span>
          </div>
        </div>

        <div className={styles.arrowGroup}>
          <span className={styles.visitText}>Visit Portal</span>
          <ChevronRight size={18} className={styles.arrowIcon} />
        </div>
      </a>
    </footer>
  );
};

export default TrustFooter;

