import React from 'react';
import RewardCard from '../RewardCard/RewardCard.jsx';
import styles from './RewardGrid.module.css';

const RewardGrid = ({ rewards, isClaiming, onClaim, onCountdownExpire }) => {
  if (!rewards || rewards.length === 0) return null;

  const topRow = rewards.slice(0, 4);
  const bottomRow = rewards.slice(4, 7);

  return (
    <section className={styles.gridSection}>
      <div className={styles.subBanner}>
        <span className={styles.subBannerText}>
          <span className={styles.sparkle}>✦</span>
          <span>Come back tomorrow for more rewards!</span>
          <span className={styles.sparkle}>✦</span>
        </span>
      </div>

      {/* Desktop View: Single 7-column Row matching ref_desktop.jpg */}
      <div className={styles.desktopGrid}>
        {rewards.map((reward) => (
          <RewardCard
            key={reward.day}
            rewardData={reward}
            isClaiming={isClaiming}
            onClaim={onClaim}
            onCountdownExpire={onCountdownExpire}
          />
        ))}
      </div>

      {/* Mobile & Tablet View: 4 + 3 arrangement matching ref_mobile.jpg */}
      <div className={styles.mobileGrid}>
        <div className={styles.mobileRowTop}>
          {topRow.map((reward) => (
            <RewardCard
              key={reward.day}
              rewardData={reward}
              isClaiming={isClaiming}
              onClaim={onClaim}
              onCountdownExpire={onCountdownExpire}
            />
          ))}
        </div>

        <div className={styles.mobileRowBottom}>
          {bottomRow.map((reward) => (
            <RewardCard
              key={reward.day}
              rewardData={reward}
              isClaiming={isClaiming}
              onClaim={onClaim}
              onCountdownExpire={onCountdownExpire}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default RewardGrid;
