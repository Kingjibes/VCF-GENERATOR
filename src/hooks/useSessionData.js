import { useState, useCallback } from 'react';
import { getOrCreateUserIdentifier } from '@/lib/utils';

export const useSessionData = (shortId, getSessionByShortId) => {
  const [session, setSession] = useState(null);
  const [sessionStatus, setSessionStatus] = useState('loading');
  const [pageLoading, setPageLoading] = useState(true);
  const [isCreator, setIsCreator] = useState(false);
  const [existingContactNames, setExistingContactNames] = useState([]);

  const fetchAndSetSessionData = useCallback(async () => {
    setPageLoading(true);
    const currentSessionData = await getSessionByShortId(shortId);
    if (!currentSessionData) {
      setSessionStatus('unavailable');
      setPageLoading(false);
      return;
    }
    setSession(currentSessionData);
    setExistingContactNames((currentSessionData.contacts || []).map(c => c.name));
    
    const currentUserIdentifier = getOrCreateUserIdentifier();
    setIsCreator(currentSessionData.user_identifier === currentUserIdentifier);
    setPageLoading(false);
  }, [getSessionByShortId, shortId]);

  return {
    session,
    setSession,
    sessionStatus,
    setSessionStatus,
    pageLoading,
    isCreator,
    existingContactNames,
    setExistingContactNames,
    fetchAndSetSessionData,
  };
};
