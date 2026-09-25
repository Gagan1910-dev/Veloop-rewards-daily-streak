import React from 'react';
import styles from './WhyStreak.module.css';

const BENEFITS = [
  {
    icon: '/assets/daily-streak/Stay_Active.png',
    title: 'Stay Active',
    desc: 'Keep your streak alive & earn more!'
  },
  {
    icon: '/assets/daily-streak/Bigger_Streak.png',
    title: 'Bigger Streak',
    desc: 'More consecutive logins, bigger rewards!'
  },
  {
    icon: '/assets/daily-streak/Exclusive-reward.png',
    title: 'Exclusive Rewards',
    desc: 'Get coins, gift cards & special bonuses!'
  },
  {
    icon: '/assets/daily-streak/Trust.png',
    title: "Don't Miss Out",
    desc: 'Come back every day & unlock all rewards!'
  }
];

const WhyStreak = () => {
  return (
    <section className={styles.whySection}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.sparkle}>✦</span> Why Maintain Your Streak? <span className={styles.sparkle}>✦</span>
        </h3>
      </div>

      <div className={styles.benefitGrid}>
        {BENEFITS.map((item, index) => (
          <div key={index} className={styles.benefitCard}>
            <div className={styles.iconWrapper}>
              <img src={item.icon} alt={item.title} className={styles.benefitIcon} />
            </div>
            <div>
              <h4 className={styles.cardTitle}>{item.title}</h4>
              <p className={styles.cardDesc}>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WhyStreak;
