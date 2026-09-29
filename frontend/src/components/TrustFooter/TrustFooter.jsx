import React from 'react';
import { ShieldCheck } from 'lucide-react';
import styles from './TrustFooter.module.css';

const TrustFooter = () => {
  return (
    <footer className={styles.footerContainer}>
      <div className={styles.trustBar}>
        <div className={styles.leftGroup}>
          <div className={styles.brandBadge}>
            <img
              src="/assets/daily-streak/Trust.png"
              alt="VELoop Verified Trust Seal"
              className={styles.trustImg}
            />
          </div>
          <div className={styles.textGroup}>
            <div className={styles.titleRow}>
              <span className={styles.officialTitle}>
                Official rewards verified on VELoop Rewards
              </span>
              <ShieldCheck size={14} className={styles.verifiedIcon} />
            </div>
            <span className={styles.tagline}>
              Stay active, stay rewarded • Server-authoritative ledger guarantee
            </span>
          </div>
        </div>

        <div className={styles.badgePill}>
          <ShieldCheck size={14} />
          <span>100% Verified</span>
        </div>
      </div>
    </footer>
  );
};

export default TrustFooter;

