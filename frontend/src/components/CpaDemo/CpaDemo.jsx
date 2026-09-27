import React from 'react';
import { ShieldCheck } from 'lucide-react';
import styles from './CpaDemo.module.css';

const CpaDemo = ({ progress = 0, stepLabel = 'Preparing your reward...', targetDay = 1 }) => {
  let assetPath = '/assets/daily-streak/VEs_Coin.png';
  if (targetDay === 4) assetPath = '/assets/daily-streak/Day-4.png';
  else if (targetDay === 5) assetPath = '/assets/daily-streak/Day-5.png';
  else if (targetDay === 7) assetPath = '/assets/daily-streak/Day-7.png';

  return (
    <div className={styles.cpaContainer}>
      <div className={styles.sponsorBadge}>
        <ShieldCheck size={14} />
        <span>Reward Verification</span>
      </div>

      <div className={styles.visualWrapper}>
        <img src={assetPath} alt="Reward Visual" className={styles.rewardAssetImg} />
      </div>

      <h3 className={styles.title}>Verifying Day {targetDay} Reward</h3>
      <p className={styles.subtitle}>
        Please wait while the VELoop server validates your check-in and prepares your reward ledger.
      </p>

      {/* Progress Bar */}
      <div className={styles.progressBarContainer}>
        <div className={styles.progressBarFill} style={{ width: `${progress}%` }} />
      </div>

      <div className={styles.stepIndicator}>
        <span className={styles.stepText}>{stepLabel}</span>
        <span className={styles.stepPercent}>{Math.round(progress)}%</span>
      </div>
    </div>
  );
};

export default CpaDemo;
