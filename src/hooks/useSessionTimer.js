import { useState, useEffect, useCallback } from 'react';

export const useSessionTimer = (session, currentStatus, setSessionStatus, getSubmittedKeyForSession) => {
  const [timeLeft, setTimeLeft] = useState('');

  const updateStatusAndTimer = useCallback(() => {
    if (!session) {
      setTimeLeft('');
      return false; 
    }

    const now = new Date();
    const expires = new Date(session.expires_at || session.expiresAt);
    const deletionScheduled = new Date(session.deletion_scheduled_at || session.deletionScheduledAt);

    if (now >= deletionScheduled) {
      if (currentStatus !== 'expired') setSessionStatus('expired');
      setTimeLeft("Session permanently closed.");
      return false; 
    } else if (now >= expires) {
      if (currentStatus !== 'download') setSessionStatus('download');
      const diff = deletionScheduled.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`Download available for: ${hours}h ${minutes}m ${seconds}s`);
      return true;
    } else {
      const submittedKey = getSubmittedKeyForSession(session.id);
      const hasAlreadySubmittedThisSession = localStorage.getItem(submittedKey) === 'true';
      const newStatus = hasAlreadySubmittedThisSession ? 'submitted' : 'active';
      if (currentStatus !== newStatus) setSessionStatus(newStatus);
      
      const diff = expires.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`Submissions open for: ${hours}h ${minutes}m ${seconds}s`);
      return true;
    }
  }, [session, currentStatus, setSessionStatus, getSubmittedKeyForSession]);

  useEffect(() => {
    if (session && (currentStatus === 'loading' || currentStatus === 'active' || currentStatus === 'download' || currentStatus === 'submitted')) {
      updateStatusAndTimer(); 
      const timerId = setInterval(() => {
        if (!updateStatusAndTimer()) {
          clearInterval(timerId);
        }
      }, 1000);
      return () => clearInterval(timerId);
    }
  }, [session, currentStatus, updateStatusAndTimer]);

  return { timeLeft };
};
