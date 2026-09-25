import React, { useState, useEffect, useCallback } from 'react';
import StreakHeader from '../../components/StreakHeader/StreakHeader.jsx';
import HeroBanner from '../../components/HeroBanner/HeroBanner.jsx';
import StreakStats from '../../components/StreakStats/StreakStats.jsx';
import UltimateReward from '../../components/UltimateReward/UltimateReward.jsx';
import RewardGrid from '../../components/RewardGrid/RewardGrid.jsx';
import WhyStreak from '../../components/WhyStreak/WhyStreak.jsx';
import TrustFooter from '../../components/TrustFooter/TrustFooter.jsx';
import StreakSkeleton from '../../components/StreakSkeleton/StreakSkeleton.jsx';
import ClaimModal from '../../components/ClaimModal/ClaimModal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import * as streakApi from '../../services/streakApi.js';
import styles from './DailyStreak.module.css';

const DailyStreakPage = () => {
  const { user, wallet, token, register, login, updateWallet, isLoading: authLoading } = useAuth();

  const [streakData, setStreakData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error'|'reset', message: string }

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalClaimResult, setModalClaimResult] = useState(null);
  const [modalClaimError, setModalClaimError] = useState(null);

  // Fetch complete backend streak state
  const loadStreak = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const data = await streakApi.getDailyStreak();
      setStreakData(data);

      if (data?.streak?.wasReset) {
        setFeedback({
          type: 'reset',
          message: 'Your previous streak was missed and has been reset. You can now claim Day 1!'
        });
      }
    } catch (err) {
      console.error('[Streak API Error]', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to load daily streak information.'
      });
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      loadStreak();
    }
  }, [token, loadStreak]);

  // User clicks "Claim Now" -> Opens CPA verification modal first
  const handleOpenClaimModal = () => {
    if (isClaiming) return;
    setModalClaimResult(null);
    setModalClaimError(null);
    setIsModalOpen(true);
  };

  // Triggered by ClaimModal after CPA demo verification completes
  const handleExecuteClaim = async () => {
    if (isClaiming) return;
    setIsClaiming(true);

    try {
      // Backend is 100% authoritative: zero body payload sent
      const response = await streakApi.claimDailyReward();

      if (response.success) {
        setModalClaimResult(response);

        // Update live wallet in AuthContext
        if (response.wallet) {
          updateWallet(response.wallet);
        }

        // Refetch complete state from backend to synchronize all 7 cards
        await loadStreak(true);
      }
    } catch (err) {
      setModalClaimError(err.message || 'Unable to claim reward.');
      // Refresh to synchronize card lock states if rejected
      await loadStreak(true);
    } finally {
      setIsClaiming(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalClaimResult(null);
    setModalClaimError(null);
  };

  // Called when visual countdown reaches 0 to re-verify server availability
  const handleCountdownExpire = useCallback(() => {
    loadStreak(true);
  }, [loadStreak]);

  const currentTargetDay = streakData?.streak?.currentDay || 1;
  const day7Reward = streakData?.rewards?.find((r) => r.day === 7);
  const day7Status = day7Reward?.status || 'LOCKED';

  return (
    <div className={styles.pageContainer}>
      <div className={styles.glowBackground} />

      {/* Top Navbar */}
      <StreakHeader wallet={wallet} />

      <main className={styles.mainContent}>
        {/* Notification Banner */}
        {feedback && (
          <div
            className={`${styles.alertBanner} ${
              feedback.type === 'success'
                ? styles.successBanner
                : feedback.type === 'reset'
                ? styles.resetBanner
                : styles.errorBanner
            }`}
          >
            <span>{feedback.message}</span>
            <button
              type="button"
              className={styles.closeAlertBtn}
              onClick={() => setFeedback(null)}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        )}

        {isLoading ? (
          <StreakSkeleton />
        ) : !streakData ? (
          <div className={styles.errorContainer}>
            <h2 className={styles.errorTitle}>Unable to Load Daily Streak</h2>
            <p className={styles.errorText}>
              There was an issue connecting to the backend streak services.
            </p>
            <button type="button" className={styles.retryBtn} onClick={() => loadStreak()}>
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Hero Section */}
            <HeroBanner />

            {/* Streak & Stats Section */}
            <StreakStats
              streakData={streakData.streak}
              nextReward={streakData.nextReward}
            />

            {/* Ultimate Reward Banner */}
            <UltimateReward
              ultimateReward={streakData.ultimateReward}
              day7Status={day7Status}
            />

            {/* 7-Day Interactive Reward Grid */}
            <RewardGrid
              rewards={streakData.rewards}
              isClaiming={isClaiming}
              onClaim={handleOpenClaimModal}
              onCountdownExpire={handleCountdownExpire}
            />

            {/* Supporting Benefits Section */}
            <WhyStreak />

            {/* Trust Footer */}
            <TrustFooter />
          </>
        )}
      </main>

      {/* CPA Demo Verification & Claim Modal */}
      <ClaimModal
        isOpen={isModalOpen}
        targetDay={currentTargetDay}
        onClose={handleCloseModal}
        onExecuteClaim={handleExecuteClaim}
        claimResult={modalClaimResult}
        claimError={modalClaimError}
      />
    </div>
  );
};

export default DailyStreakPage;
