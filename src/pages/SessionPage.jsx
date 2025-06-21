import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { useSessionStore } from '@/hooks/useSessionStore';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { getOrCreateUserIdentifier } from '@/lib/utils';

import SessionHeader from '@/pages/session/SessionHeader';
import SessionMainContent from '@/pages/session/SessionMainContent';
import SessionFooterInfo from '@/pages/session/SessionFooterInfo';
import { useSessionTimer } from '@/hooks/useSessionTimer';
import { useSessionData } from '@/hooks/useSessionData';

const getSubmittedKeyForSession = (sessionId) => `submittedContact_${getOrCreateUserIdentifier()}_${sessionId}`;

const SessionPage = () => {
  const { shortId } = useParams();
  const { toast } = useToast();
  const { getSessionByShortId, addContactToSession, incrementDownloadCount, loading: storeLoading } = useSessionStore();

  const {
    session,
    setSession,
    sessionStatus,
    setSessionStatus,
    pageLoading,
    isCreator,
    existingContactNames,
    setExistingContactNames,
    fetchAndSetSessionData,
  } = useSessionData(shortId, getSessionByShortId);
  
  const { timeLeft } = useSessionTimer(session, sessionStatus, setSessionStatus, getSubmittedKeyForSession);

  const [userSubmitted, setUserSubmitted] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [showGroupJoinMessage, setShowGroupJoinMessage] = useState(false);
  const [groupJoinCountdown, setGroupJoinCountdown] = useState(4);
  const countdownRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, []);

  const startCountdown = useCallback(() => {
    if (!session?.whatsappGroupLink) return;

    setShowGroupJoinMessage(true);
    setGroupJoinCountdown(4);

    // Visual countdown (updates every second)
    const interval = setInterval(() => {
      setGroupJoinCountdown(prev => Math.max(0, prev - 1));
    }, 1000);

    // Actual redirect after 4 seconds
    countdownRef.current = setTimeout(() => {
      window.location.href = session.whatsappGroupLink;
      clearInterval(interval);
    }, 4000);

    return () => clearInterval(interval);
  }, [session]);

  const handleManualJoin = () => {
    if (countdownRef.current) {
      clearTimeout(countdownRef.current);
    }
    if (session?.whatsappGroupLink) {
      window.location.href = session.whatsappGroupLink;
    }
  };

  const handleSubmitContact = async (contactData) => {
    if (sessionStatus !== 'active' || !session) {
      toast({ 
        title: 'Session Not Active', 
        description: 'This session is not currently accepting submissions.', 
        variant: 'destructive' 
      });
      return;
    }
    
    const submittedKey = getSubmittedKeyForSession(session.id);
    if (localStorage.getItem(submittedKey) === 'true') {
      toast({ 
        title: 'Already Submitted', 
        description: 'You have already submitted your contact for this session.', 
        variant: 'default' 
      });
      setUserSubmitted(true); 
      return;
    }

    setFormSubmitting(true);
    const result = await addContactToSession(session.id, contactData);
    setFormSubmitting(false);

    if (result) {
      toast({ title: 'Contact Submitted!', description: 'Your information has been successfully added.' });
      localStorage.setItem(submittedKey, 'true');
      setUserSubmitted(true);
      setSession(prev => ({
        ...prev,
        contacts: [...(prev?.contacts || []), result]
      }));
      setExistingContactNames([...(existingContactNames || []), result.name]);
      
      if (session.whatsappGroupLink) {
        startCountdown();
      }
    } else {
      toast({ 
        title: 'Submission Error', 
        description: 'Could not submit contact. Session might have expired or name already exists.', 
        variant: 'destructive' 
      });
    }
  };

  const handleDownloadVCF = async () => {
    if (!session?.contacts?.length) {
      toast({ 
        title: "No Contacts", 
        description: "There are no contacts in this session to download.", 
        variant: "destructive" 
      });
      return;
    }

    const { generateVCF, downloadVCF } = await import('@/lib/vcfGenerator');
    const vcfData = generateVCF(session.contacts);
    downloadVCF(vcfData, 'CIPHER', session.vcfDownloadIdentifier);
    await incrementDownloadCount(session.id);
    setSession(prev => ({ ...prev, download_count: (prev.download_count || 0) + 1 }));
  };

  if (pageLoading || (storeLoading && !session)) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-180px)]">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      className="container mx-auto py-8 px-4 md:px-0 flex flex-col items-center justify-center min-h-[calc(100vh-180px)]"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full max-w-lg">
        <SessionHeader session={session} shortId={shortId} />
        <CardContent>
          <SessionMainContent
            session={session}
            sessionStatus={sessionStatus}
            timeLeft={timeLeft}
            isCreator={isCreator}
            formSubmitting={formSubmitting}
            onSubmitContact={handleSubmitContact}
            onDownloadVCF={handleDownloadVCF}
            userSubmitted={userSubmitted}
            expirationTime={session?.expires_at?.toLocaleString() || ''}
            existingContactNames={existingContactNames}
            showGroupJoinMessage={showGroupJoinMessage}
            groupJoinCountdown={groupJoinCountdown}
            onManualGroupJoin={handleManualJoin}
            whatsappGroupLink={session?.whatsappGroupLink}
          />
        </CardContent>
        <SessionFooterInfo session={session} sessionStatus={sessionStatus} userSubmitted={userSubmitted} />
      </Card>
    </motion.div>
  );
};

export default SessionPage;
