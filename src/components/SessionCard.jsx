import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Users, Download, EyeOff, Link as LinkIcon, Copy, Mail } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { generateVCF, downloadVCF } from '@/lib/vcfGenerator';
import { useSessionStore } from '@/hooks/useSessionStore';

const SessionCard = ({ session, onDelete }) => {
  const { toast } = useToast();
  const { incrementDownloadCount: incrementOriginalDownloadCount } = useSessionStore(); 
  const sessionLink = `${window.location.origin}/s/${session.short_id}`;
  
  const now = new Date();
  const expiresAt = new Date(session.expiresAt || session.expires_at);
  const deletionScheduledAt = new Date(session.deletionScheduledAt || session.deletion_scheduled_at);

  const isSubmissionPeriodActive = now < expiresAt;
  const isDownloadPeriodActive = now >= expiresAt && now < deletionScheduledAt;
  const isFullyExpired = now >= deletionScheduledAt;

  const contactCount = session.contactCount !== undefined ? session.contactCount : (session.contacts && session.contacts[0] ? session.contacts[0].count : 0);


  const handleCopyLink = () => {
    navigator.clipboard.writeText(sessionLink)
      .then(() => toast({ title: "Link Copied!", description: "Session link copied to clipboard." }))
      .catch(err => {
        toast({ title: "Error", description: "Failed to copy link.", variant: "destructive" });
        console.error('Failed to copy link: ', err);
      });
  };

  const handleDownloadVCF = async () => {
    if (contactCount === 0) {
      toast({ title: "No Contacts", description: "There are no contacts in this session to download." });
      return;
    }
    
    let fullContacts = session.contacts;
    if (session.contacts && session.contacts.length > 0 && session.contacts[0].hasOwnProperty('count')) {
        window.open(sessionLink, '_blank'); 
        toast({ title: "Action Required", description: "Please download the VCF from the session page for full contact details." });
        return;
    }

    if (!session.vcfDownloadIdentifier) {
        toast({ title: "Error", description: "VCF download identifier is missing for this session.", variant: "destructive" });
        return;
    }
    
    const vcfData = generateVCF(fullContacts);
    const filename = downloadVCF(vcfData, 'CIPHER', session.vcfDownloadIdentifier);
    
    if (filename) {
        toast({ title: "VCF Downloaded", description: `'${filename}' has been downloaded.` });
        await incrementOriginalDownloadCount(session.id); // This increments the session's specific download_count
    } else {
        toast({ title: "Download Error", description: "Could not prepare VCF for download.", variant: "destructive"});
    }
  };

  const handleShareViaEmail = () => {
    if (contactCount === 0) {
      toast({ title: "No Contacts", description: "There are no contacts to share." });
      return;
    }
    window.open(sessionLink, '_blank');
    toast({ title: "Action Required", description: "Please share the VCF from the session page for full contact details." });
    return;
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };
  
  let statusText;
  if (isSubmissionPeriodActive) {
    statusText = `Submissions close: ${expiresAt.toLocaleString()}`;
  } else if (isDownloadPeriodActive) {
    statusText = `Download until: ${deletionScheduledAt.toLocaleString()}`;
  } else {
    statusText = `Session ended: ${deletionScheduledAt.toLocaleString()}`;
  }


  return (
    <motion.div variants={cardVariants}>
      <Card className={`overflow-hidden ${isFullyExpired && contactCount === 0 ? 'opacity-50' : ''}`}>
        <CardHeader>
          <CardTitle className="truncate">{session.group_name || `Session: ${session.short_id}`}</CardTitle>
          <CardDescription>
            Short Link ID: {session.short_id} | Created: {new Date(session.createdAt || session.created_at).toLocaleString()}
            {session.vcfDownloadIdentifier && ` | File ID: CIPHER${String(session.vcfDownloadIdentifier).padStart(3, '0')}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className={`mr-2 h-4 w-4 ${isSubmissionPeriodActive ? 'text-primary' : isDownloadPeriodActive ? 'text-accent' : 'text-destructive'}`} />
            <span>{statusText}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="mr-2 h-4 w-4 text-secondary" />
            <span>Contacts: {contactCount} | Downloads: {session.download_count || 0}</span>
          </div>
          {(isSubmissionPeriodActive || isDownloadPeriodActive) && (
            <div className="flex items-center text-sm text-muted-foreground break-all">
              <LinkIcon className="mr-2 h-4 w-4 text-accent flex-shrink-0" />
              <span>Link: <a href={sessionLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{sessionLink}</a></span>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between gap-2">
          <div className="flex gap-2 flex-wrap">
            {(isSubmissionPeriodActive || isDownloadPeriodActive) && (
              <Button variant="outline" size="sm" onClick={handleCopyLink}>
                <Copy className="mr-2 h-4 w-4" /> Copy Link
              </Button>
            )}
            <Button variant="default" size="sm" onClick={handleDownloadVCF} disabled={contactCount === 0 || isFullyExpired}>
              <Download className="mr-2 h-4 w-4" /> Download VCF
            </Button>
             <Button variant="outline" size="sm" onClick={handleShareViaEmail} disabled={contactCount === 0 || isFullyExpired}>
              <Mail className="mr-2 h-4 w-4" /> Share Contacts
            </Button>
          </div>
          <Button variant="destructive" size="sm" onClick={() => onDelete(session.id)} disabled={isFullyExpired && contactCount > 0}>
            <EyeOff className="mr-2 h-4 w-4" /> Hide Session
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default SessionCard;
