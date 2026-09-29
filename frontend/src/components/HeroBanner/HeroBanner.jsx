import React from 'react';
import styles from './HeroBanner.module.css';

const HeroBanner = () => {
  return (
    <section className={styles.heroSection}>
      <div className={styles.heroCard}>
        <div className={styles.textContent}>
          <div className={styles.categoryBadge}>
            <span className={styles.badgeSparkle}>✦</span>
            <span>Your Daily Streak</span>
          </div>
          <h2 className={styles.heading}>
            Login Daily & Unlock <span className={styles.highlightText}>Bigger Rewards!</span>
          </h2>
          <p className={styles.subheading}>
            Check in every consecutive day to claim VEs coins and unlock official Amazon Gift Cards.
          </p>
        </div>

        {/* Desktop dual artwork */}
        <div className={styles.desktopVisuals}>
          <img
            src="/assets/daily-streak/Top_Left.png"
            alt="Calendar Streak Artwork"
            className={styles.topLeftImg}
          />
          <img
            src="/assets/daily-streak/Top_right.png"
            alt="Gift Box Artwork"
            className={styles.topRightImg}
          />
        </div>

        {/* Mobile single consolidated artwork */}
        <div className={styles.mobileVisual}>
          <img
            src="/assets/daily-streak/Mobile_Hero.png"
            alt="Streak Hero Artwork"
            className={styles.mobileHeroImg}
          />
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
