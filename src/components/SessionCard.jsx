import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Users, Download, Trash2, Link as LinkIcon, Copy, Mail, EyeOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { generateVCF, downloadVCF } from '@/lib/vcfGenerator';

const SessionCard = ({ session, onDelete }) => {
  const { toast } = useToast();
  const sessionLink = `${window.location.origin}/s/${session.short_id}`;
  
  const now = new Date();
  const expiresAt = new Date(session.expiresAt || session.expires_at);
  const deletionScheduledAt = new Date(session.deletionScheduledAt || session.deletion_scheduled_at);

  const isSubmissionPeriodActive = now < expiresAt;
  const isDownloadPeriodActive = now >= expiresAt && now < deletionScheduledAt;
  const isFullyExpired = now >= deletionScheduledAt;


  const handleCopyLink = () => {
    navigator.clipboard.writeText(sessionLink)
      .then(() => toast({ title: "Link Copied!", description: "Session link copied to clipboard." }))
      .catch(err => {
        toast({ title: "Error", description: "Failed to copy link.", variant: "destructive" });
        console.error('Failed to copy link: ', err);
      });
  };

  const handleDownloadVCF = () => {
    if (session.contacts.length === 0) {
      toast({ title: "No Contacts", description: "There are no contacts in this session to download." });
      return;
    }
    const vcfData = generateVCF(session.contacts);
    downloadVCF(vcfData, 'CIPHER.vcf');
    toast({ title: "VCF Downloaded", description: "'CIPHER.vcf' has been downloaded." });
  };

  const handleShareViaEmail = () => {
    if (session.contacts.length === 0) {
      toast({ title: "No Contacts", description: "There are no contacts to share." });
      return;
    }
    const vcfData = generateVCF(session.contacts);
    const vcfFileName = "CIPHER.vcf";
    const vcfFile = new File([vcfData], vcfFileName, {type: "text/vcard;charset=utf-8"});

    const subject = `Contacts from ${session.group_name || 'Session'}: ${vcfFileName}`;
    let body = `Hello,\n\nThe contacts from session "${session.group_name || session.short_id}" are ready.\n\n`;

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [vcfFile] })) {
      navigator.share({
        files: [vcfFile],
        title: subject,
        text: `Collected contacts from session: ${session.group_name || session.short_id}. File: ${vcfFileName}`,
      })
      .then(() => toast({ title: "Sharing VCF...", description: "Your VCF file is being shared."}))
      .catch(() => {
        toast({ title: "Sharing Failed", description: "Could not use native share. Opening email client instead.", variant: "default" });
        body += `Please download the VCF file ("${vcfFileName}") from the app if it's not attached, or if you have trouble importing directly from this email.\n\nYou can download it from the session card using the "Download VCF" button.\n\nSession Link: ${sessionLink}\n\nAlternatively, you can try copying the text below, saving it as a .vcf file, and importing that:\n\n---BEGIN VCF---\n${vcfData}\n---END VCF---\n`;
        const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoLink;
      });
    } else {
      toast({ title: "Opening Email Client", description: "Please use the 'Download VCF' button and attach 'CIPHER.vcf' to your email." });
      body += `To get the contacts:\n1. Go back to the Contact Gain web application.\n2. Find the session card for "${session.group_name || session.short_id}".\n3. Click the "Download VCF" button. This will save 'CIPHER.vcf' to your device.\n4. Attach this 'CIPHER.vcf' file to an email to yourself or import it directly into your contacts application.\n\nSession Link: ${sessionLink}\n\nFor reference, the VCF data is also included below (best to use the downloaded file):\n\n---BEGIN VCF---\n${vcfData}\n---END VCF---\n`;
      const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoLink;
    }
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
      <Card className={`overflow-hidden ${isFullyExpired && session.contacts.length === 0 ? 'opacity-50' : ''}`}>
        <CardHeader>
          <CardTitle className="truncate">{session.group_name || `Session: ${session.short_id}`}</CardTitle>
          <CardDescription>
            Short Link ID: {session.short_id} | Created: {new Date(session.createdAt || session.created_at).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className={`mr-2 h-4 w-4 ${isSubmissionPeriodActive ? 'text-primary' : isDownloadPeriodActive ? 'text-accent' : 'text-destructive'}`} />
            <span>{statusText}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="mr-2 h-4 w-4 text-secondary" />
            <span>Contacts Collected: {session.contacts.length}</span>
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
            <Button variant="default" size="sm" onClick={handleDownloadVCF} disabled={session.contacts.length === 0 || isFullyExpired}>
              <Download className="mr-2 h-4 w-4" /> Download VCF
            </Button>
             <Button variant="outline" size="sm" onClick={handleShareViaEmail} disabled={session.contacts.length === 0 || isFullyExpired}>
              <Mail className="mr-2 h-4 w-4" /> Share Contacts
            </Button>
          </div>
          <Button variant="destructive" size="sm" onClick={() => onDelete(session.id)} disabled={isFullyExpired}>
            <EyeOff className="mr-2 h-4 w-4" /> Hide Session
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default SessionCard;