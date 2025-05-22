import { useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { getOrCreateUserIdentifier, generateShortId } from '@/lib/utils';

const DOWNLOAD_WINDOW_HOURS = 5;

export const useSessionManager = (setSessions, setLoading) => {
  const { toast } = useToast();
  const userIdentifier = getOrCreateUserIdentifier();

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('id, created_at, duration_minutes, expires_at, user_identifier, group_name, short_id, deletion_scheduled_at, user_deleted_at, download_count, vcf_download_identifier, contacts (count)')
        .eq('user_identifier', userIdentifier)
        .is('user_deleted_at', null)
        .order('created_at', { ascending: false });

      if (sessionsError) {
        console.error("Error fetching sessions (initial):", sessionsError);
        throw sessionsError;
      }
      
      setSessions(sessionsData.map(s => ({
        ...s,
        createdAt: new Date(s.created_at),
        expiresAt: new Date(s.expires_at),
        deletionScheduledAt: new Date(s.deletion_scheduled_at),
        contacts: s.contacts[0] ? s.contacts : [{count: 0}],
        contactCount: s.contacts[0] ? s.contacts[0].count : 0,
        downloadCount: s.download_count || 0,
        vcfDownloadIdentifier: s.vcf_download_identifier 
      })));

    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast({ title: "Error", description: "Could not fetch your sessions. Please try refreshing.", variant: "destructive" });
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [toast, userIdentifier, setSessions, setLoading]);

  const createSession = useCallback(async (durationMinutes, groupName) => {
    setLoading(true);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + parseInt(durationMinutes, 10) * 60 * 1000);
    const deletionScheduledAt = new Date(expiresAt.getTime() + DOWNLOAD_WINDOW_HOURS * 60 * 60 * 1000);
    const shortId = generateShortId();
    
    try {
      const { data: counterData, error: counterError } = await supabase.rpc('increment_app_counter', { counter_name_param: 'session_vcf_download_name' });
      if (counterError) {
        console.error("Error incrementing VCF download name counter:", counterError);
        throw counterError;
      }
      const vcfDownloadIdentifier = counterData;

      const { data, error } = await supabase
        .from('sessions')
        .insert([{ 
          duration_minutes: parseInt(durationMinutes, 10), 
          expires_at: expiresAt.toISOString(),
          deletion_scheduled_at: deletionScheduledAt.toISOString(),
          user_identifier: userIdentifier,
          group_name: groupName,
          short_id: shortId,
          user_deleted_at: null,
          download_count: 0,
          vcf_download_identifier: vcfDownloadIdentifier
        }])
        .select('id, created_at, duration_minutes, expires_at, user_identifier, group_name, short_id, deletion_scheduled_at, user_deleted_at, download_count, vcf_download_identifier, contacts (count)')
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
        contacts: data.contacts[0] ? data.contacts : [{count: 0}],
        contactCount: data.contacts[0] ? data.contacts[0].count : 0,
        downloadCount: data.download_count || 0,
        vcfDownloadIdentifier: data.vcf_download_identifier
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
  }, [toast, userIdentifier, setSessions, setLoading]);

  const getSessionByShortId = useCallback(async (shortId) => {
    setLoading(true);
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('id, created_at, duration_minutes, expires_at, user_identifier, group_name, short_id, deletion_scheduled_at, user_deleted_at, download_count, vcf_download_identifier')
        .eq('short_id', shortId)
        .single();
      
      if (sessionError) {
        if (sessionError.code === 'PGRST116') { 
          return null; 
        }
        throw sessionError;
      }
      if (!sessionData) return null;

      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .eq('session_id', sessionData.id);

      if (contactsError) {
        console.error("Error fetching contacts for session:", contactsError);
        toast({ title: "Error", description: "Could not fetch contact details for the session.", variant: "destructive" });
      }

      return {
        ...sessionData,
        createdAt: new Date(sessionData.created_at),
        expiresAt: new Date(sessionData.expires_at),
        deletionScheduledAt: new Date(sessionData.deletion_scheduled_at),
        contacts: contactsData || [],
        downloadCount: sessionData.download_count || 0,
        vcfDownloadIdentifier: sessionData.vcf_download_identifier
      };

    } catch (error) {
      console.error("Error fetching session by short ID:", error);
      toast({ title: "Error", description: "Could not fetch session details.", variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast, setLoading]);

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
  }, [toast, userIdentifier, setSessions, setLoading]);
  
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
        
        await supabase.from('contacts').delete().in('session_id', idsToDelete);
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
          await supabase.from('contacts').delete().in('session_id', trulyEmptyAndHiddenIds);
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
  }, [userIdentifier, setSessions]);


  const incrementDownloadCount = useCallback(async (sessionId) => {
    try {
      const { data, error } = await supabase.rpc('increment_download_count', { session_id_param: sessionId });
      if (error) throw error;
      setSessions(prevSessions => 
        prevSessions.map(s => 
          s.id === sessionId ? { ...s, download_count: (s.download_count || 0) + 1 } : s
        )
      );
      return data; 
    } catch (error) {
      console.error('Error incrementing download count:', error);
      toast({ title: "Error", description: "Failed to update download count.", variant: "destructive" });
      return null;
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
