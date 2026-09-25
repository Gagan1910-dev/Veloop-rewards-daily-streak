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
          <span className={styles.sparkle}>✦</span> Come back tomorrow for more rewards! <span className={styles.sparkle}>✦</span>
        </span>
      </div>

      <div className={styles.cardsContainer}>
        {/* Top row: Days 1 - 4 */}
        <div className={styles.rowTop}>
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

        {/* Bottom row: Days 5 - 7 */}
        <div className={styles.rowBottom}>
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
