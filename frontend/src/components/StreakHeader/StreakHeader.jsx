import React from 'react';
import { ArrowLeft, LogOut, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import styles from './StreakHeader.module.css';

const StreakHeader = ({ wallet, onBack }) => {
  const { user, logout } = useAuth();
  const ves = wallet?.vesBalance ?? 0;
  const gems = wallet?.gemsBalance ?? 0;

  return (
    <header className={styles.headerContainer}>
      <div className={styles.leftSection}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={onBack}
          aria-label="Go Back"
          title="Go Back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className={styles.titleWrapper}>
          <h1 className={styles.title}>Daily Streak</h1>
          <img
            src="/assets/daily-streak/Flame.png"
            alt="Streak Fire"
            className={styles.flameIcon}
          />
        </div>
      </div>

      <div className={styles.rightSection}>
        {/* Always display VEs Coin balance with official asset */}
        <div className={styles.vesPill} title="VEs Balance">
          <img
            src="/assets/daily-streak/VEs_Coin.png"
            alt="VEs Coin"
            className={styles.vesCoinSmall}
          />
          <span>{ves} VEs</span>
        </div>

        {/* Gems Balance */}
        <div className={styles.balancePill} title="Gems Balance">
          <span className={styles.gemIcon}>💎</span>
          <span>{gems}</span>
        </div>

        {user && (
          <div className={styles.userSection}>
            <div className={styles.userBadge} title={user.email}>
              <User size={14} className={styles.userIcon} />
              <span className={styles.userName}>{user.name || 'User'}</span>
            </div>
            <button
              type="button"
              className={styles.logoutBtn}
              onClick={logout}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={16} />
              <span className={styles.logoutText}>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default StreakHeader;

