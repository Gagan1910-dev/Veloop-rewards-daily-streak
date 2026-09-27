import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import * as streakApi from '../../services/streakApi.js';
import styles from './StreakHistoryModal.module.css';

const StreakHistoryModal = ({ isOpen, onClose }) => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await streakApi.getStreakHistory();
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[Streak History Error]', err);
      setError(err.message || 'Unable to load streak check-in history.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, fetchHistory]);

  if (!isOpen) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <AnimatePresence>
      <div className={styles.modalBackdrop} onClick={onClose}>
        <motion.div
          className={styles.modalCard}
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={styles.modalHeader}>
            <div className={styles.titleGroup}>
              <div className={styles.calendarIconBadge}>
                <Calendar size={18} />
              </div>
              <div>
                <h3 className={styles.title}>Streak Calendar & History</h3>
                <p className={styles.subtitle}>Verified Daily Check-In Ledger</p>
              </div>
            </div>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close history modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content Body */}
          <div className={styles.modalBody}>
            {isLoading ? (
              <div className={styles.loadingContainer}>
                <Loader2 size={32} className="spinner-border text-primary" />
                <p className={styles.loadingText}>Fetching check-in history...</p>
              </div>
            ) : error ? (
              <div className={styles.errorContainer}>
                <AlertCircle size={32} color="#f87171" />
                <p className={styles.errorText}>{error}</p>
                <button
                  type="button"
                  className={styles.retryBtn}
                  onClick={fetchHistory}
                >
                  Retry
                </button>
              </div>
            ) : history.length === 0 ? (
              <div className={styles.emptyContainer}>
                <div className={styles.emptyIconCircle}>
                  <Calendar size={36} />
                </div>
                <h4 className={styles.emptyTitle}>No Check-Ins Yet</h4>
                <p className={styles.emptyText}>
                  You have not claimed any daily rewards in this streak. Claim Day 1 to start your ledger!
                </p>
              </div>
            ) : (
              <div className={styles.historyList}>
                <div className={styles.statsSummary}>
                  <span className={styles.totalBadge}>
                    Total Check-Ins: <strong>{history.length}</strong>
                  </span>
                  <span className={styles.verifiedBadge}>
                    <ShieldCheck size={13} style={{ display: 'inline', marginRight: '4px' }} />
                    Ledger Verified
                  </span>
                </div>

                {history.map((item, idx) => (
                  <div key={item.claimId || idx} className={styles.historyItem}>
                    <div className={styles.itemLeft}>
                      <div className={styles.dayPill}>Day {item.day}</div>
                      <div className={styles.itemInfo}>
                        <h4 className={styles.rewardTitle}>
                          {item.reward?.title || `Day ${item.day}`}
                          <span className={styles.rewardType}>
                            {item.reward?.currency === 'INR' ? 'Amazon Gift Card' : 'VEs Coin'}
                          </span>
                        </h4>
                        <div className={styles.metaRow}>
                          <Clock size={12} />
                          <span>{formatDate(item.claimedAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.itemRight}>
                      <span className={styles.claimedPill}>✓ Claimed</span>
                      {item.transactionId && (
                        <span className={styles.refId}>
                          Txn: {item.transactionId.slice(-8)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default StreakHistoryModal;
