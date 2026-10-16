import React from 'react';
import { ArrowLeft, LogOut, User, Calendar } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import styles from './StreakHeader.module.css';

const StreakHeader = ({ wallet, streakData, onBack }) => {
  const { user, logout } = useAuth();
  const ves = wallet?.vesBalance ?? 0;
  const gems = wallet?.gemsBalance ?? 0;
  const currentStreak = streakData?.currentStreak ?? 1;

  return (
    <header className={styles.headerContainer}>
      <div className={styles.leftSection}>
        {onBack && (
          <button
            type="button"
            className={styles.backBtn}
            onClick={onBack}
            aria-label="Go Back"
            title="Go Back"
          >
            <ArrowLeft size={18} />
          </button>
        )}

        <div className={styles.calendarIconBox}>
          <Calendar size={18} className={styles.calendarIcon} />
        </div>

        <div className={styles.titleWrapper}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Daily Streak</h1>
            <img
              src="/assets/daily-streak/Flame.png"
              alt="Streak Flame"
              className={styles.mobileFlameIcon}
            />
          </div>
          <p className={styles.subtitleDesktop}>
            Login daily, maintain your streak, and unlock bigger rewards every day!
          </p>
        </div>
      </div>

      <div className={styles.rightSection}>
        {/* Desktop Streak Indicator matching ref_desktop.jpg */}
        <div className={styles.desktopStreakBadge}>
          <div className={styles.flameCircle}>
            <img
              src="/assets/daily-streak/Flame.png"
              alt="Streak Flame"
              className={styles.desktopFlameIcon}
            />
          </div>
          <div className={styles.streakTextGroup}>
            <span className={styles.streakCountTitle}>{currentStreak} Day Streak</span>
            <span className={styles.streakSubText}>Keep it going!</span>
          </div>
        </div>

        {/* VEs Coin Balance Pill */}
        <div className={styles.vesPill} title="VEs Balance">
          <img
            src="/assets/daily-streak/VEs_Coin.png"
            alt="VEs Coin"
            className={styles.vesCoinSmall}
          />
          <span className={styles.vesAmount}>{ves} VEs</span>
        </div>

        {/* Gems Balance */}
        <div className={styles.balancePill} title="Gems Balance">
          <span className={styles.gemIcon}>💎</span>
          <span>{gems}</span>
        </div>

        {user && (
          <div className={styles.userSection}>
            <div className={styles.userBadge} title={user.email}>
              <User size={13} className={styles.userIcon} />
              <span className={styles.userName}>{user.name || 'User'}</span>
            </div>
            <button
              type="button"
              className={styles.logoutBtn}
              onClick={logout}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={15} />
              <span className={styles.logoutText}>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default StreakHeader;

