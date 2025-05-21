import { useState, useEffect } from 'react';
import { useSessionManager } from './sessionManager';
import { useContactManager } from './contactManager';

export const useSessionStore = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const { 
    fetchSessions, 
    createSession, 
    getSessionByShortId, 
    markSessionAsDeletedByUser, 
    cleanupExpiredSessions,
    incrementDownloadCount
  } = useSessionManager(setSessions, setLoading);
  
  const { addContactToSession } = useContactManager(setSessions);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    const intervalId = setInterval(cleanupExpiredSessions, 15 * 60 * 1000); 
    cleanupExpiredSessions(); 
    return () => clearInterval(intervalId);
  }, [cleanupExpiredSessions]);

  return {
    sessions,
    loading,
    createSession,
    addContactToSession,
    getSessionByShortId, 
    markSessionAsDeletedByUser,
    fetchSessions,
    incrementDownloadCount,
  };
};