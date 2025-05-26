import { useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { getOrCreateUserIdentifier } from '@/lib/utils';
import {
  fetchUserSessionsFromDB,
  createNewSessionInDB,
  fetchSessionByShortIdFromDB,
  markSessionAsDeletedByUserInDB,
  cleanupExpiredSessionsInDB,
  incrementSessionDownloadCountInDB
} from '@/lib/supabaseSessionApi';

export const useSessionManager = (setSessions, setLoading) => {
  const { toast } = useToast();
  const userIdentifier = getOrCreateUserIdentifier();

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const sessionsData = await fetchUserSessionsFromDB(userIdentifier);
      setSessions(sessionsData);
    } catch (error) {
      toast({ title: "Error", description: "Could not fetch your sessions. Please try refreshing.", variant: "destructive" });
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [toast, userIdentifier, setSessions, setLoading]);

  const createSession = useCallback(async (durationMinutes, groupName, whatsappGroupLink) => {
    setLoading(true);
    try {
      const newSession = await createNewSessionInDB(durationMinutes, groupName, userIdentifier, whatsappGroupLink);
      if (newSession) {
        setSessions(prevSessions => [newSession, ...prevSessions]);
      }
      return newSession;
    } catch (error) {
      if (error.code === '23505' && error.message && error.message.includes('short_id')) {
        toast({ title: "Conflict", description: "Generated short ID conflicted, please try again.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: "Could not create session.", variant: "destructive" });
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast, userIdentifier, setSessions, setLoading]);

  const getSessionByShortId = useCallback(async (shortId) => {
    setLoading(true);
    try {
      return await fetchSessionByShortIdFromDB(shortId);
    } catch (error) {
      toast({ title: "Error", description: "Could not fetch session details.", variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast, setLoading]);

  const markSessionAsDeletedByUser = useCallback(async (sessionId) => {
    setLoading(true);
    try {
      await markSessionAsDeletedByUserInDB(sessionId, userIdentifier);
      setSessions(prevSessions => prevSessions.filter(session => session.id !== sessionId));
      toast({ title: "Session Hidden", description: "The session has been hidden from your list. It will be fully deleted later." });
    } catch (error) {
      toast({ title: "Error", description: "Could not hide session.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast, userIdentifier, setSessions, setLoading]);
  
  const cleanupExpiredSessions = useCallback(async () => {
    try {
      const { deletedCount, cleanedEmptyCount } = await cleanupExpiredSessionsInDB();
      if (deletedCount > 0) {
        console.log(`Permanently deleted ${deletedCount} sessions past their deletion schedule.`);
        fetchSessions();
      }
      if (cleanedEmptyCount > 0) {
        console.log(`Cleaned up ${cleanedEmptyCount} empty sessions previously hidden by creator.`);
      }
    } catch (error) {
      console.error("Error cleaning up expired sessions (hook):", error);
    }
  }, [fetchSessions]);

  const incrementDownloadCount = useCallback(async (sessionId) => {
    try {
      await incrementSessionDownloadCountInDB(sessionId);
      setSessions(prevSessions => 
        prevSessions.map(s => 
          s.id === sessionId ? { ...s, download_count: (s.download_count || 0) + 1 } : s
        )
      );
    } catch (error) {
      toast({ title: "Error", description: "Failed to update download count.", variant: "destructive" });
    }
  }, [toast, setSessions]);

  return {
    fetchSessions,
    createSession,
    getSessionByShortId,
    markSessionAsDeletedByUser,
    cleanupExpiredSessions,
    incrementDownloadCount,
  };
};
