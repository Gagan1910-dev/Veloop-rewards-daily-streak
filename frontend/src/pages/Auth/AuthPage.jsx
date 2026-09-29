import React, { useState, useEffect } from 'react';
import { Loader2, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import StreakLoader from '../../components/StreakLoader/StreakLoader.jsx';
import styles from './AuthPage.module.css';

const AuthPage = () => {
  const { login, register, isLoading } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStage, setLoadingStage] = useState('initial'); // 'initial' | 'waking'

  // Adaptive loader messaging if request takes longer (e.g. Render cold start)
  useEffect(() => {
    if (!isSubmitting) {
      return;
    }
    const timer = setTimeout(() => {
      setLoadingStage('waking');
    }, 3500);
    return () => {
      clearTimeout(timer);
      setLoadingStage('initial');
    };
  }, [isSubmitting]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setFormError(null);

    if (mode === 'register' && (!name || name.trim().length < 2)) {
      setFormError('Please enter a valid name (at least 2 characters).');
      return;
    }

    if (!email || !email.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
    } catch (err) {
      if (err.status === 401) {
        setFormError('Invalid email or password. Please check your credentials or register first.');
      } else if (err.status === 409) {
        setFormError(err.message || 'An account with this email already exists.');
      } else if (err.code === 'OFFLINE') {
        setFormError('You appear to be offline. Please check your internet connection.');
      } else if (err.code === 'SERVER_WAKING_UP' || err.code === 'SERVER_UNAVAILABLE') {
        setFormError('VELoop servers are waking up. Please try again in a moment.');
      } else {
        setFormError(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('intern.demo@velooprewards.in');
    setPassword('DemoPassword123!');
    setName('Demo Intern');
    setFormError(null);
  };

  return (
    <div className={styles.authPageContainer}>
      <div className={styles.glowOrb} />

      {/* Premium VELoop Streak Loader Overlay during authenticating */}
      {isSubmitting && (
        <div className={styles.loadingOverlay} role="status" aria-live="polite">
          <StreakLoader
            message={
              loadingStage === 'waking'
                ? 'VELoop servers are waking up...'
                : (mode === 'login' ? 'Signing in...' : 'Creating your account...')
            }
            subMessage={
              loadingStage === 'waking'
                ? 'Just a moment while we connect you.'
                : 'Preparing your daily streak...'
            }
          />
        </div>
      )}

      <div className={styles.authCard}>
        <div className={styles.brandHeader}>
          <img
            src="/assets/daily-streak/Flame.png"
            alt="VELoop Fire"
            className={styles.flameIcon}
          />
          <h2 className={styles.brandTitle}>VELoop Rewards</h2>
          <span className={styles.brandSubtitle}>
            {mode === 'login'
              ? 'Sign in to claim your daily rewards'
              : 'Create an account to start your streak'}
          </span>
        </div>

        {/* Tab Switcher */}
        <div className={styles.tabSwitcher}>
          <button
            type="button"
            className={`${styles.tabBtn} ${mode === 'login' ? styles.activeTab : ''}`}
            onClick={() => {
              setMode('login');
              setFormError(null);
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${mode === 'register' ? styles.activeTab : ''}`}
            onClick={() => {
              setMode('register');
              setFormError(null);
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {formError && <div className={styles.errorAlert}>{formError}</div>}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Full Name</label>
              <input
                type="text"
                className={styles.inputField}
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.label}>Email Address</label>
            <input
              type="email"
              className={styles.inputField}
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              className={styles.inputField}
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="spinner-border spinner-border-sm" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <button
          type="button"
          className={styles.demoQuickBtn}
          onClick={handleFillDemo}
        >
          <Sparkles size={14} style={{ display: 'inline', marginRight: '4px' }} />
          Fill Evaluator Demo Credentials
        </button>
      </div>
    </div>
  );
};

export default AuthPage;
