import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';

const USER_IDENTIFIER_KEY = 'contactGainUserIdentifier';
const DOWNLOAD_WINDOW_HOURS = 5;

const getOrCreateUserIdentifier = () => {
  let identifier = localStorage.getItem(USER_IDENTIFIER_KEY);
  if (!identifier) {
    identifier = crypto.randomUUID();
    localStorage.setItem(USER_IDENTIFIER_KEY, identifier);
  }
  return identifier;
};

const generateShortId = (length = 7) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export const useSessionStore = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const userIdentifier = getOrCreateUserIdentifier();

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('*, contacts(*)')
        .eq('user_identifier', userIdentifier)
        .is('user_deleted_at', null) 
        .order('created_at', { ascending: false });

      if (sessionsError) throw sessionsError;
      
      setSessions(sessionsData.map(s => ({
        ...s,
        createdAt: new Date(s.created_at),
        expiresAt: new Date(s.expires_at),
        deletionScheduledAt: new Date(s.deletion_scheduled_at),
        contacts: s.contacts || [] 
      })));

    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast({ title: "Error", description: "Could not fetch sessions.", variant: "destructive" });
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [toast, userIdentifier]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const createSession = useCallback(async (durationMinutes, groupName) => {
    setLoading(true);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + parseInt(durationMinutes, 10) * 60 * 1000);
    const deletionScheduledAt = new Date(expiresAt.getTime() + DOWNLOAD_WINDOW_HOURS * 60 * 60 * 1000);
    const shortId = generateShortId();
    
    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert([{ 
          duration_minutes: parseInt(durationMinutes, 10), 
          expires_at: expiresAt.toISOString(),
          deletion_scheduled_at: deletionScheduledAt.toISOString(),
          user_identifier: userIdentifier,
          group_name: groupName,
          short_id: shortId,
          user_deleted_at: null
        }])
        .select('*, contacts(*)')
        .single();

      if (error) {
        if (error.code === '23505' && error.message.includes('short_id')) {
          toast({ title: "Conflict", description: "Generated short ID conflicted, please try again.", variant: "destructive" });
          return null;
        }
        throw error;
      }
      
      const newSession = {
        ...data,
        createdAt: new Date(data.created_at),
        expiresAt: new Date(data.expires_at),
        deletionScheduledAt: new Date(data.deletion_scheduled_at),
        contacts: data.contacts || []
      };
      setSessions(prevSessions => [newSession, ...prevSessions]);
      return newSession;
    } catch (error) {
      console.error("Error creating session:", error);
      toast({ title: "Error", description: "Could not create session.", variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast, userIdentifier]);

  const addContactToSession = useCallback(async (sessionId, contact) => {
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('expires_at')
        .eq('id', sessionId)
        .single();

      if (sessionError || !sessionData) {
        toast({ title: "Error", description: "Session not found or could not be verified.", variant: "destructive" });
        return null;
      }

      if (new Date(sessionData.expires_at) < new Date()) {
        toast({ title: "Session Expired", description: "Cannot add contact, session has expired.", variant: "destructive" });
        return null;
      }
      
      const { data, error } = await supabase
        .from('contacts')
        .insert([{ session_id: sessionId, name: contact.name, phone: contact.phone, email: contact.email || null }])
        .select()
        .single();

      if (error) throw error;
      
      setSessions(prevSessions =>
        prevSessions.map(s =>
          s.id === sessionId
            ? { ...s, contacts: [...s.contacts, data] }
            : s
        )
      );
      return data;
    } catch (error) {
      console.error("Error adding contact:", error);
      toast({ title: "Error", description: "Could not add contact.", variant: "destructive" });
      return null;
    }
  }, [toast]);

  const getSessionByShortId = useCallback(async (shortId) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*, contacts(*)')
        .eq('short_id', shortId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') { 
          return null; 
        }
        throw error;
      }
      if (!data) return null;

      return {
        ...data,
        createdAt: new Date(data.created_at),
        expiresAt: new Date(data.expires_at),
        deletionScheduledAt: new Date(data.deletion_scheduled_at),
        contacts: data.contacts || []
      };

    } catch (error) {
      console.error("Error fetching session by short ID:", error);
      toast({ title: "Error", description: "Could not fetch session details.", variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const markSessionAsDeletedByUser = useCallback(async (sessionId) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ user_deleted_at: new Date().toISOString() })
        .eq('id', sessionId)
        .eq('user_identifier', userIdentifier);

      if (error) throw error;

      setSessions(prevSessions => prevSessions.filter(session => session.id !== sessionId));
      toast({ title: "Session Hidden", description: "The session has been hidden from your list. It will be fully deleted later." });
    } catch (error) {
      console.error("Error marking session as deleted:", error);
      toast({ title: "Error", description: "Could not hide session.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast, userIdentifier]);
  
  const cleanupExpiredSessions = useCallback(async () => {
    const now = new Date().toISOString();
    try {
      const { data: sessionsToDelete, error: fetchError } = await supabase
        .from('sessions')
        .select('id')
        .lt('deletion_scheduled_at', now);

      if (fetchError) throw fetchError;
      
      if (sessionsToDelete && sessionsToDelete.length > 0) {
        const idsToDelete = sessionsToDelete.map(s => s.id);
        const { error: deleteError } = await supabase
          .from('sessions')
          .delete()
          .in('id', idsToDelete);
        
        if (deleteError) throw deleteError;
        
        setSessions(prev => prev.filter(s => !idsToDelete.includes(s.id) || s.user_identifier !== userIdentifier));
        console.log(`Permanently deleted ${idsToDelete.length} sessions past their deletion schedule.`);
      }

      const { data: emptyCreatorHiddenSessions, error: fetchEmptyHiddenError } = await supabase
        .from('sessions')
        .select('id, contacts(count)')
        .lt('expires_at', now) 
        .not('user_deleted_at', 'is', null); 

      if (fetchEmptyHiddenError) throw fetchEmptyHiddenError;

      if (emptyCreatorHiddenSessions && emptyCreatorHiddenSessions.length > 0) {
        const trulyEmptyAndHiddenIds = emptyCreatorHiddenSessions
          .filter(s => s.contacts.length === 0 || (s.contacts[0] && s.contacts[0].count === 0))
          .map(s => s.id);
        
        if (trulyEmptyAndHiddenIds.length > 0) {
          const { error: deleteEmptyHiddenError } = await supabase
            .from('sessions')
            .delete()
            .in('id', trulyEmptyAndHiddenIds);
          if (deleteEmptyHiddenError) throw deleteEmptyHiddenError;
          console.log(`Cleaned up ${trulyEmptyAndHiddenIds.length} empty sessions previously hidden by creator.`);
        }
      }


    } catch (error) {
      console.error("Error cleaning up expired sessions:", error);
    }
  }, [userIdentifier]);

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
  };
};