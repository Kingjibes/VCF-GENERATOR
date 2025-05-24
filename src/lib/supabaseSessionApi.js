import { supabase } from '@/lib/supabaseClient';
import { generateShortId } from '@/lib/utils';

const DOWNLOAD_WINDOW_HOURS = 5; 

export const fetchUserSessionsFromDB = async (userIdentifier) => {
  const { data, error } = await supabase
    .from('sessions')
    .select('id, created_at, duration_minutes, expires_at, user_identifier, group_name, short_id, deletion_scheduled_at, user_deleted_at, download_count, vcf_download_identifier, contacts (count)')
    .eq('user_identifier', userIdentifier)
    .is('user_deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching sessions from DB:", error);
    throw error;
  }
  return data.map(s => ({
    ...s,
    createdAt: new Date(s.created_at),
    expiresAt: new Date(s.expires_at),
    deletionScheduledAt: new Date(s.deletion_scheduled_at),
    contacts: s.contacts[0] ? s.contacts : [{count: 0}],
    contactCount: s.contacts[0] ? s.contacts[0].count : 0,
    downloadCount: s.download_count || 0,
    vcfDownloadIdentifier: s.vcf_download_identifier
  }));
};

export const createNewSessionInDB = async (durationMinutes, groupName, userIdentifier) => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + parseInt(durationMinutes, 10) * 60 * 1000);
  const deletionScheduledAt = new Date(expiresAt.getTime() + DOWNLOAD_WINDOW_HOURS * 60 * 60 * 1000);
  const shortId = generateShortId();

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
    console.error("Error creating session in DB:", error);
    throw error;
  }
  return {
    ...data,
    createdAt: new Date(data.created_at),
    expiresAt: new Date(data.expires_at),
    deletionScheduledAt: new Date(data.deletion_scheduled_at),
    contacts: data.contacts[0] ? data.contacts : [{count: 0}],
    contactCount: data.contacts[0] ? data.contacts[0].count : 0,
    downloadCount: data.download_count || 0,
    vcfDownloadIdentifier: data.vcf_download_identifier
  };
};

export const fetchSessionByShortIdFromDB = async (shortId) => {
  const { data: sessionData, error: sessionError } = await supabase
    .from('sessions')
    .select('id, created_at, duration_minutes, expires_at, user_identifier, group_name, short_id, deletion_scheduled_at, user_deleted_at, download_count, vcf_download_identifier')
    .eq('short_id', shortId)
    .single();
  
  if (sessionError) {
    if (sessionError.code === 'PGRST116') { 
      return null; 
    }
    console.error("Error fetching session by short ID from DB:", sessionError);
    throw sessionError;
  }
  if (!sessionData) return null;

  const { data: contactsData, error: contactsError } = await supabase
    .from('contacts')
    .select('*')
    .eq('session_id', sessionData.id);

  if (contactsError) {
    console.error("Error fetching contacts for session from DB:", contactsError);
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
};

export const markSessionAsDeletedByUserInDB = async (sessionId, userIdentifier) => {
  const { error } = await supabase
    .from('sessions')
    .update({ user_deleted_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('user_identifier', userIdentifier);

  if (error) {
    console.error("Error marking session as deleted in DB:", error);
    throw error;
  }
};

export const cleanupExpiredSessionsInDB = async () => {
  const now = new Date().toISOString();
  let deletedCount = 0;
  let cleanedEmptyCount = 0;

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
    deletedCount = idsToDelete.length;
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
      cleanedEmptyCount = trulyEmptyAndHiddenIds.length;
    }
  }
  return { deletedCount, cleanedEmptyCount };
};

export const incrementSessionDownloadCountInDB = async (sessionId) => {
  const { data, error } = await supabase.rpc('increment_download_count', { session_id_param: sessionId });
  if (error) {
    console.error('Error incrementing download count in DB:', error);
    throw error;
  }
  return data; 
};
