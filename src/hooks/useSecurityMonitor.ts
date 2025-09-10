import { useState, useEffect } from 'react';

interface SecurityMonitor {
  failedAttempts: number;
  isLocked: boolean;
  lockoutTimeRemaining: number;
  lastFailedAttempt: Date | null;
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export const useSecurityMonitor = (identifier: string) => {
  const [security, setSecurity] = useState<SecurityMonitor>({
    failedAttempts: 0,
    isLocked: false,
    lockoutTimeRemaining: 0,
    lastFailedAttempt: null,
  });

  const storageKey = `security_${identifier}`;

  useEffect(() => {
    // Load security state from localStorage
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        const lastAttempt = data.lastFailedAttempt ? new Date(data.lastFailedAttempt) : null;
        
        // Check if lockout has expired
        if (lastAttempt && Date.now() - lastAttempt.getTime() > LOCKOUT_DURATION) {
          // Reset security state
          setSecurity({
            failedAttempts: 0,
            isLocked: false,
            lockoutTimeRemaining: 0,
            lastFailedAttempt: null,
          });
          localStorage.removeItem(storageKey);
        } else {
          setSecurity({
            ...data,
            lastFailedAttempt: lastAttempt,
            isLocked: data.failedAttempts >= MAX_FAILED_ATTEMPTS,
            lockoutTimeRemaining: lastAttempt 
              ? Math.max(0, LOCKOUT_DURATION - (Date.now() - lastAttempt.getTime()))
              : 0,
          });
        }
      } catch (error) {
        // Error handled silently
      }
    }
  }, [storageKey]);

  // Update lockout timer
  useEffect(() => {
    if (security.isLocked && security.lockoutTimeRemaining > 0) {
      const timer = setInterval(() => {
        setSecurity(prev => {
          const remaining = Math.max(0, prev.lockoutTimeRemaining - 1000);
          if (remaining === 0) {
            // Lockout expired
            localStorage.removeItem(storageKey);
            return {
              failedAttempts: 0,
              isLocked: false,
              lockoutTimeRemaining: 0,
              lastFailedAttempt: null,
            };
          }
          return { ...prev, lockoutTimeRemaining: remaining };
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [security.isLocked, security.lockoutTimeRemaining, storageKey]);

  const recordFailedAttempt = () => {
    const now = new Date();
    const newFailedAttempts = security.failedAttempts + 1;
    const newSecurity = {
      failedAttempts: newFailedAttempts,
      isLocked: newFailedAttempts >= MAX_FAILED_ATTEMPTS,
      lockoutTimeRemaining: newFailedAttempts >= MAX_FAILED_ATTEMPTS ? LOCKOUT_DURATION : 0,
      lastFailedAttempt: now,
    };

    setSecurity(newSecurity);
    localStorage.setItem(storageKey, JSON.stringify({
      ...newSecurity,
      lastFailedAttempt: now.toISOString(),
    }));

    // Log security event silently
    
    if (newSecurity.isLocked) {
      // Security logging disabled
    }
  };

  const recordSuccessfulAttempt = () => {
    setSecurity({
      failedAttempts: 0,
      isLocked: false,
      lockoutTimeRemaining: 0,
      lastFailedAttempt: null,
    });
    localStorage.removeItem(storageKey);
    // Successful login recorded
  };

  const formatTimeRemaining = (): string => {
    const minutes = Math.floor(security.lockoutTimeRemaining / 60000);
    const seconds = Math.floor((security.lockoutTimeRemaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    ...security,
    recordFailedAttempt,
    recordSuccessfulAttempt,
    formatTimeRemaining,
    maxAttempts: MAX_FAILED_ATTEMPTS,
  };
};