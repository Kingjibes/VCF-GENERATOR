import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useSessionStore } from '@/hooks/useSessionStore';
import { useToast } from '@/components/ui/use-toast';
import { Send, Clock, UserPlus, CheckCircle, XCircle, Loader2, Users, Download } from 'lucide-react';
import { generateVCF, downloadVCF } from '@/lib/vcfGenerator';

const SessionPage = () => {
  const { shortId } = useParams();
  const navigate = useNavigate();
  const { getSessionByShortId, addContactToSession, loading: storeLoading } = useSessionStore();
  const { toast } = useToast();

  const [session, setSession] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  
  const [sessionStatus, setSessionStatus] = useState('loading'); // 'loading', 'active', 'download', 'expired', 'unavailable'
  const [timeLeft, setTimeLeft] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchAndSetSession = useCallback(async () => {
    setPageLoading(true);
    const currentSessionData = await getSessionByShortId(shortId);
    if (!currentSessionData) {
      setSessionStatus('unavailable');
      setPageLoading(false);
      return;
    }
    setSession(currentSessionData);
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
        setSessionStatus('active');
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
  }, [session]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast({ title: 'Validation Error', description: 'Please enter both name and phone number.', variant: 'destructive' });
      return;
    }
    if (sessionStatus !== 'active' || !session) {
      toast({ title: 'Session Not Active', description: 'This session is not currently accepting submissions.', variant: 'destructive' });
      return;
    }

    setFormSubmitting(true);
    const contactData = { name, phone, email: email.trim() || null };
    const result = await addContactToSession(session.id, contactData);
    setFormSubmitting(false);

    if (result) {
      toast({ title: 'Contact Submitted!', description: 'Your information has been successfully added.' });
      setName('');
      setPhone('');
      setEmail('');
      setSubmitted(true);
      // Optimistically update local contact count for display if needed, or refetch session
      setSession(prev => ({ ...prev, contacts: [...(prev.contacts || []), result] }));
    } else {
      toast({ title: 'Submission Error', description: 'Could not submit contact. Session might have just expired.', variant: 'destructive' });
    }
  };

  const handleDownloadVCF = () => {
    if (!session || !session.contacts || session.contacts.length === 0) {
      toast({ title: "No Contacts", description: "There are no contacts in this session to download.", variant: "destructive" });
      return;
    }
    const vcfData = generateVCF(session.contacts);
    downloadVCF(vcfData, 'CIPHER.vcf');
    toast({ title: "VCF Downloaded", description: "'CIPHER.vcf' has been downloaded." });
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

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  };

  let content;
  switch (sessionStatus) {
    case 'active':
      if (submitted) {
        content = (
          <motion.div variants={itemVariants} className="text-center py-8">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <p className="text-2xl font-semibold text-green-500">Thank You!</p>
            <p className="text-muted-foreground">Your contact information has been submitted come back after
            setTimeLeft (` ${hours}h ${minutes}m ${seconds}s`);
      .</p>
            <Button onClick={() => navigate('/')} className="mt-6">Back to Home</Button>
          </motion.div>
        );
      } else {
        content = (
          <motion.form onSubmit={handleSubmit} className="space-y-6" variants={itemVariants}>
            <div className="text-center mb-6 p-3 rounded-md bg-primary/10 border border-primary/30">
              <Clock className="inline mr-2 h-5 w-5 text-primary" />
              <span className="font-semibold text-primary">{timeLeft}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-lg">Full Name</Label>
              <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Jane Doe" required className="text-lg p-3" disabled={formSubmitting} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-lg">Phone Number</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g., +233xxxxxxxx" required className="text-lg p-3" disabled={formSubmitting} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-lg">Email (Optional)</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g., jane.doe@example.com" className="text-lg p-3" disabled={formSubmitting} />
            </div>
            <Button type="submit" size="lg" className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity text-primary-foreground shadow-lg hover:shadow-primary/50 text-lg py-3" disabled={formSubmitting}>
              {formSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
              Submit Contact
            </Button>
          </motion.form>
        );
      }
      break;
    case 'download':
      content = (
        <motion.div variants={itemVariants} className="text-center py-8">
          <Download className="mx-auto h-16 w-16 text-primary mb-4" />
          <p className="text-2xl font-semibold">Download Contacts</p>
          <p className="text-muted-foreground mb-2">Submissions for this session are closed.</p>
          <div className="text-center mb-6 p-3 rounded-md bg-accent/10 border border-accent/30">
            <Clock className="inline mr-2 h-5 w-5 text-accent" />
            <span className="font-semibold text-accent">{timeLeft}</span>
          </div>
          <Button onClick={handleDownloadVCF} size="lg" disabled={!session || !session.contacts || session.contacts.length === 0} className="bg-gradient-to-r from-accent to-secondary hover:opacity-90 transition-opacity text-primary-foreground shadow-lg hover:shadow-accent/50">
            <Download className="mr-2 h-5 w-5" /> Download VCF (CIPHER.vcf)
          </Button>
          {(!session || !session.contacts || session.contacts.length === 0) && (
            <p className="text-sm text-muted-foreground mt-2">No contacts were submitted to this session.</p>
          )}
        </motion.div>
      );
      break;
    case 'expired':
    case 'unavailable':
    default:
      content = (
        <motion.div variants={itemVariants} className="text-center py-8">
          <XCircle className="mx-auto h-16 w-16 text-destructive mb-4" />
          <p className="text-2xl font-semibold text-destructive">Session Unavailable</p>
          <p className="text-muted-foreground">This contact collection session is no longer active or could not be found.</p>
          <Button onClick={() => navigate('/')} className="mt-6">Back to Home</Button>
        </motion.div>
      );
      break;
  }

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
        <CardHeader className="text-center">
          <motion.div variants={itemVariants}>
            <Users className="mx-auto h-12 w-12 text-primary mb-4" />
            <CardTitle>Contact Session{session?.group_name ? `: ${session.group_name}` : ''}</CardTitle>
            <CardDescription>
              Session Link ID: {shortId}
            </CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent>
          {content}
        </CardContent>
        {session && (sessionStatus === 'active' || sessionStatus === 'download') && !submitted && (
          <CardFooter className="text-xs text-muted-foreground text-center block">
            {sessionStatus === 'active' && <p>Your information will be shared with the session creator.</p>}
            <p>Session created at: {new Date(session.created_at || session.createdAt).toLocaleString()}</p>
             {sessionStatus === 'active' && <p>Submissions close at: {new Date(session.expires_at || session.expiresAt).toLocaleString()}</p>}
             {sessionStatus === 'download' && <p>Download link active until: {new Date(session.deletion_scheduled_at || session.deletionScheduledAt).toLocaleString()}</p>}
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
};

export default SessionPage;
