import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { useSessionStore } from '@/hooks/useSessionStore';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { getOrCreateUserIdentifier, USER_IDENTIFIER_KEY } from '@/lib/utils';

import SessionHeader from '@/pages/session/SessionHeader';
import SessionMainContent from '@/pages/session/SessionMainContent';
import SessionFooterInfo from '@/pages/session/SessionFooterInfo';

const getSubmittedKeyForSession = (sessionId) => `submittedContact_${getOrCreateUserIdentifier()}_${sessionId}`;

const SessionPage = () => {
  const { shortId } = useParams();
  const navigate = useNavigate();
  const { getSessionByShortId, addContactToSession, incrementDownloadCount, loading: storeLoading } = useSessionStore();
  const { toast } = useToast();

  const [session, setSession] = useState(null);
  const [sessionStatus, setSessionStatus] = useState('loading'); 
  const [timeLeft, setTimeLeft] = useState('');
  const [userSubmitted, setUserSubmitted] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [existingContactNames, setExistingContactNames] = useState([]);

  const fetchAndSetSession = useCallback(async () => {
    setPageLoading(true);
    const currentSessionData = await getSessionByShortId(shortId);
    if (!currentSessionData) {
      setSessionStatus('unavailable');
      setPageLoading(false);
      return;
    }
    setSession(currentSessionData);
    setExistingContactNames((currentSessionData.contacts || []).map(c => c.name));
    
    const submittedKey = getSubmittedKeyForSession(currentSessionData.id);
    if (localStorage.getItem(submittedKey) === 'true') {
      setUserSubmitted(true);
    } else {
      setUserSubmitted(false);
    }

    const currentUserIdentifier = getOrCreateUserIdentifier();
    setIsCreator(currentSessionData.user_identifier === currentUserIdentifier);
    setPageLoading(false);
  }, [getSessionByShortId, shortId]);

  useEffect(() => {
    fetchAndSetSession();
  }, [fetchAndSetSession]);

  useEffect(() => {
    if (!session) return;

    const updateStatusAndTimer = () => {
      const now = new Date();
      const expires = new Date(session.expires_at || session.expiresAt);
      const deletionScheduled = new Date(session.deletion_scheduled_at || session.deletionScheduledAt);

      if (now >= deletionScheduled) {
        setSessionStatus('expired');
        setTimeLeft("Session permanently closed.");
        return false;
      } else if (now >= expires) {
        setSessionStatus('download');
        const diff = deletionScheduled.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`Download available for: ${hours}h ${minutes}m ${seconds}s`);
        return true;
      } else {
        const submittedKey = getSubmittedKeyForSession(session.id);
        const hasAlreadySubmittedThisSession = localStorage.getItem(submittedKey) === 'true';
        setSessionStatus(hasAlreadySubmittedThisSession || userSubmitted ? 'submitted' : 'active');
        
        const diff = expires.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`Submissions open for: ${hours}h ${minutes}m ${seconds}s`);
        return true;
      }
    };

    updateStatusAndTimer();
    const timerId = setInterval(() => {
      if (!updateStatusAndTimer()) {
        clearInterval(timerId);
      }
    }, 1000);
    return () => clearInterval(timerId);
  }, [session, userSubmitted]);

  const handleSubmitContact = async (contactData) => {
    if (sessionStatus !== 'active' || !session) {
      toast({ title: 'Session Not Active', description: 'This session is not currently accepting submissions.', variant: 'destructive' });
      return;
    }
    
    const submittedKey = getSubmittedKeyForSession(session.id);
    if (localStorage.getItem(submittedKey) === 'true') {
        toast({ title: 'Already Submitted', description: 'You have already submitted your contact for this session.', variant: 'default' });
        setUserSubmitted(true); // Ensure state is consistent
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
    } else {
      toast({ title: 'Submission Error', description: 'Could not submit contact. Session might have just expired or name already exists.', variant: 'destructive' });
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
          />
        </CardContent>
        <SessionFooterInfo session={session} sessionStatus={sessionStatus} userSubmitted={userSubmitted} />
      </Card>
    </motion.div>
  );
};

export default SessionPage;
