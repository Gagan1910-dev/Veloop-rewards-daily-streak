import React from 'react';
import { Lock, Check } from 'lucide-react';
import styles from './UltimateReward.module.css';

const UltimateReward = ({ ultimateReward, day7Status }) => {
  const isClaimed = day7Status === 'CLAIMED';
  const rewardTitle = ultimateReward?.title || '₹5';
  const rewardSubtitle = ultimateReward?.subtitle || 'Amazon Gift Card';

  return (
    <section className={styles.ultimateSection}>
      <div className={styles.ultimateCard}>
        <div className={styles.leftContent}>
          <div className={styles.crownContainer}>
            <img
              src="/assets/daily-streak/Day-7.png"
              alt="Ultimate Crown Reward"
              className={styles.crownImg}
            />
            <span className={styles.vipBadge}>VIP</span>
          </div>

          <div className={styles.rewardDetails}>
            <span className={styles.ultimateLabel}>Ultimate Reward • Day 7 Finale</span>
            <h3 className={styles.amountTitle}>{rewardTitle}</h3>
            <div className={styles.brandTag}>
              <span className={styles.amazonIcon}>a</span>
              <span>{rewardSubtitle}</span>
            </div>
          </div>
        </div>

        <div className={styles.rightStatus}>
          <div className={styles.lockPill}>
            {isClaimed ? (
              <>
                <Check size={16} color="#10b981" />
                <span>Claimed</span>
              </>
            ) : (
              <>
                <Lock size={15} />
                <span>Locked</span>
              </>
            )}
          </div>
          <span className={styles.unlockSubtext}>Unlock on Day 7</span>
        </div>
      </div>
    </section>
  );
};

export default UltimateReward;
