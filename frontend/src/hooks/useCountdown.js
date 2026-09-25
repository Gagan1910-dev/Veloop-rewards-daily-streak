import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for calculating server-synced remaining time until nextClaimAt
 * @param {string|Date|null} targetIsoString
 * @param {Function} onExpire Callback when countdown reaches 0
 * @returns {Object} { formatted: string, hours: number, minutes: number, seconds: number, isExpired: boolean, totalSeconds: number }
 */
export const useCountdown = (targetIsoString, onExpire) => {
  const calculateTimeLeft = useCallback(() => {
    if (!targetIsoString) {
      return { totalSeconds: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, formatted: '00:00:00' };
    }

    const target = new Date(targetIsoString).getTime();
    const now = Date.now();
    const difference = target - now;

    if (difference <= 0) {
      return { totalSeconds: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, formatted: '00:00:00' };
    }

    const totalSeconds = Math.floor(difference / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (num) => String(num).padStart(2, '0');
    const formatted = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

    return { totalSeconds, hours, minutes, seconds, isExpired: false, formatted };
  }, [targetIsoString]);

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

  useEffect(() => {
    setTimeLeft(calculateTimeLeft());

    if (!targetIsoString) return;

    const interval = setInterval(() => {
      const updated = calculateTimeLeft();
      setTimeLeft(updated);

      if (updated.isExpired) {
        clearInterval(interval);
        if (typeof onExpire === 'function') {
          onExpire();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetIsoString, calculateTimeLeft, onExpire]);

  return timeLeft;
};

export default useCountdown;
