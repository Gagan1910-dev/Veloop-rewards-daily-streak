import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import CpaDemo from '../CpaDemo/CpaDemo.jsx';
import styles from './ClaimModal.module.css';

const ClaimModal = ({
  isOpen,
  targetDay = 1,
  onClose,
  onExecuteClaim,
  claimResult,
  claimError
}) => {
  const [stage, setStage] = useState('VERIFYING'); // 'VERIFYING' | 'CLAIMING' | 'SUCCESS' | 'ERROR'
  const [progress, setProgress] = useState(0);
  const [stepLabel, setStepLabel] = useState('Preparing your reward...');

  useEffect(() => {
    if (!isOpen) {
      setStage('VERIFYING');
      setProgress(0);
      setStepLabel('Preparing your reward...');
      return;
    }

    // Run CPA Demo Verification progression
    let current = 0;
    const interval = setInterval(() => {
      current += 5;
      if (current <= 35) {
        setStepLabel('Preparing your reward...');
      } else if (current <= 75) {
        setStepLabel('Reward Verification...');
      } else if (current < 100) {
        setStepLabel('Verification completed...');
      }

      setProgress(Math.min(current, 100));

      if (current >= 100) {
        clearInterval(interval);
        setStage('CLAIMING');
        // Trigger server claim
        if (typeof onExecuteClaim === 'function') {
          onExecuteClaim();
        }
      }
    }, 90);

    return () => clearInterval(interval);
  }, [isOpen, onExecuteClaim]);

  // Transition to SUCCESS or ERROR when parent finishes claim
  useEffect(() => {
    if (claimResult) {
      setStage('SUCCESS');
    } else if (claimError) {
      setStage('ERROR');
    }
  }, [claimResult, claimError]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className={styles.modalBackdrop}>
        <motion.div
          className={styles.modalContent}
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {/* Close Button (enabled only on finish or error) */}
          {(stage === 'SUCCESS' || stage === 'ERROR') && (
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          )}

          {/* Stage 1: CPA Verification Demo */}
          {stage === 'VERIFYING' && (
            <CpaDemo
              progress={progress}
              stepLabel={stepLabel}
              targetDay={targetDay}
            />
          )}

          {/* Stage 2: Submitting Authoritative Claim to Backend */}
          {stage === 'CLAIMING' && (
            <div className={styles.successContainer}>
              <div className={styles.successIconWrapper} style={{ borderColor: '#a78bfa', color: '#a78bfa' }}>
                <Loader2 size={36} className="spinner-border text-primary" />
              </div>
              <h3 className={styles.successTitle}>Claiming Reward...</h3>
              <p className={styles.successSubtitle}>
                Validating server timestamps and crediting ledger...
              </p>
            </div>
          )}

          {/* Stage 3: Success View */}
          {stage === 'SUCCESS' && (
            <div className={styles.successContainer}>
              <div className={styles.successIconWrapper}>
                <CheckCircle2 size={38} />
              </div>

              <h3 className={styles.successTitle}>Reward Claimed!</h3>
              <p className={styles.successSubtitle}>
                Day {claimResult?.claim?.day || targetDay} reward has been credited to your wallet.
              </p>

              <div className={styles.rewardHighlightCard}>
                <span className={styles.rewardAmount}>
                  {claimResult?.claim?.reward?.title || `Day ${targetDay}`}
                </span>
                <span className={styles.rewardDetailsText}>
                  {claimResult?.claim?.reward?.subtitle || 'Daily Check-In Reward'}
                </span>
                {claimResult?.claim?.referenceId && (
                  <span className={styles.txnMeta}>
                    Ref: {claimResult.claim.referenceId}
                  </span>
                )}
              </div>

              <button
                type="button"
                className={styles.actionBtn}
                onClick={onClose}
              >
                Collect & Continue
              </button>
            </div>
          )}

          {/* Stage 4: Error View */}
          {stage === 'ERROR' && (
            <div className={styles.errorContainer}>
              <div className={styles.errorIconWrapper}>
                <AlertCircle size={36} />
              </div>

              <h3 className={styles.errorTitle}>Claim Notice</h3>
              <p className={styles.errorMessage}>
                {claimError || 'Your reward could not be claimed at this moment.'}
              </p>

              <button
                type="button"
                className={styles.dismissBtn}
                onClick={onClose}
              >
                Close
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ClaimModal;
