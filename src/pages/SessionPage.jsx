import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  const { getSessionByShortId, addContactToSession, incrementDownloadCount, loading: storeLoading } = useSessionStore();
  const { toast } = useToast();

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
  const [groupJoinCountdown, setGroupJoinCountdown] = useState(10);
  const countdownIntervalRef = useRef(null);

  useEffect(() => {
    fetchAndSetSessionData();
  }, [fetchAndSetSessionData]);

  useEffect(() => {
    if (session) {
      const submittedKey = getSubmittedKeyForSession(session.id);
      setUserSubmitted(localStorage.getItem(submittedKey) === 'true');
    }
  }, [session, sessionStatus]);


  const clearCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const startGroupJoinCountdown = useCallback(() => {
    if (session?.whatsappGroupLink) {
      clearCountdown();
      setShowGroupJoinMessage(true);
      setGroupJoinCountdown(10);
      countdownIntervalRef.current = setInterval(() => {
        setGroupJoinCountdown(prev => {
          if (prev <= 1) {
            clearCountdown();
            if (session.whatsappGroupLink) {
              window.location.href = session.whatsappGroupLink;
            }
            setShowGroupJoinMessage(false); 
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [session, clearCountdown]);

  useEffect(() => {
    return () => clearCountdown(); 
  }, [clearCountdown]);


  const handleSubmitContact = async (contactData) => {
    if (sessionStatus !== 'active' || !session) {
      toast({ title: 'Session Not Active', description: 'This session is not currently accepting submissions.', variant: 'destructive' });
      return;
    }
    
    const submittedKey = getSubmittedKeyForSession(session.id);
    if (localStorage.getItem(submittedKey) === 'true') {
        toast({ title: 'Already Submitted', description: 'You have already submitted your contact for this session.', variant: 'default' });
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
      setSession(prev => {
        const updatedContacts = [...(prev?.contacts || []), result];
        setExistingContactNames(updatedContacts.map(c => c.name));
        return { ...prev, contacts: updatedContacts };
      });
      
      if (session.whatsappGroupLink) {
        startGroupJoinCountdown();
      }

    } else {
      toast({ title: 'Submission Error', description: 'Could not submit contact. Session might have just expired or name already exists.', variant: 'destructive' });
    }
  };

  const handleManualGroupJoin = () => {
    clearCountdown();
    setShowGroupJoinMessage(false);
    if (session?.whatsappGroupLink) {
      window.location.href = session.whatsappGroupLink;
    }
  };

  const handleDownloadVCFFromPage = async () => {
    if (!session || !session.contacts || session.contacts.length === 0) {
      toast({ title: "No Contacts", description: "There are no contacts in this session to download.", variant: "destructive" });
      return;
    }
    if (sessionStatus !== 'download' && !(sessionStatus === 'active' && isCreator) && !(sessionStatus === 'submitted' && isCreator) ) {
      toast({ title: "Not Available", description: "VCF download is not active for this session yet.", variant: "destructive" });
      return;
    }
    if (!session.vcfDownloadIdentifier) {
      toast({ title: "Error", description: "VCF download identifier is missing for this session.", variant: "destructive" });
      return;
    }

    const { generateVCF, downloadVCF } = await import('@/lib/vcfGenerator');
    const vcfData = generateVCF(session.contacts);
    const filename = downloadVCF(vcfData, 'CIPHER', session.vcfDownloadIdentifier);
    
    if (filename) {
      toast({ title: "VCF Downloaded", description: `'${filename}' has been downloaded.` });
      await incrementDownloadCount(session.id); 
      setSession(prev => ({...prev, download_count: (prev.download_count || 0) + 1}));
    } else {
      toast({ title: "Download Error", description: "Could not prepare VCF for download.", variant: "destructive"});
    }
  };


  if (pageLoading || (storeLoading && !session && sessionStatus === 'loading')) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-180px)]">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  const pageVariants = {
    initial: { opacity: 0, scale: 0.9 },
    in: { opacity: 1, scale: 1 },
    out: { opacity: 0, scale: 0.9 }
  };

  return (
    <motion.div
      className="container mx-auto py-8 px-4 md:px-0 flex flex-col items-center justify-center min-h-[calc(100vh-180px)]"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
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
            onDownloadVCF={handleDownloadVCFFromPage}
            userSubmitted={userSubmitted}
            expirationTime={session ? new Date(session.expires_at || session.expiresAt).toLocaleString() : ''}
            existingContactNames={existingContactNames}
            showGroupJoinMessage={showGroupJoinMessage}
            groupJoinCountdown={groupJoinCountdown}
            onManualGroupJoin={handleManualGroupJoin}
            whatsappGroupLink={session?.whatsappGroupLink}
          />
        </CardContent>
        <SessionFooterInfo session={session} sessionStatus={sessionStatus} userSubmitted={userSubmitted} />
      </Card>
    </motion.div>
  );
};

export default SessionPage;
