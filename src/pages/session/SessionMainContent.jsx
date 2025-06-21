import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Users as GroupIcon, CheckCircle, Download, ArrowLeft } from 'lucide-react';
import SessionStatusDisplay from '@/components/session/SessionStatusDisplay';
import ContactForm from '@/components/session/ContactForm';
import DownloadSection from '@/components/session/DownloadSection';
import VcfImportInstructions from '@/components/session/VcfImportInstructions';
import { motion } from 'framer-motion';

const GroupJoinSection = ({ countdown, onManualJoin }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center"
  >
    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
    <p className="text-lg font-semibold text-green-700 dark:text-green-400">Important Next Step!</p>
    <p className="text-sm text-muted-foreground mb-1">
      To receive the VCF file with all collected contacts, you <span className="font-bold">must join</span> the WhatsApp group.
    </p>
    <p className="text-sm text-muted-foreground mb-3">The VCF file will be shared there once the session concludes.</p>
    <Button 
      onClick={onManualJoin} 
      variant="outline" 
      className="mb-2 border-green-500 text-green-600 hover:bg-green-500/20"
    >
      <GroupIcon className="mr-2 h-4 w-4" /> Join WhatsApp Group Now
    </Button>
    <p className="text-xs text-muted-foreground">
      Auto-redirect in <span className="font-bold text-green-600 dark:text-green-500">{countdown}</span> seconds...
    </p>
  </motion.div>
);

const SessionMainContent = ({
  session,
  sessionStatus,
  timeLeft,
  isCreator,
  formSubmitting,
  onSubmitContact,
  onDownloadVCF,
  userSubmitted,
  expirationTime,
  existingContactNames,
  showGroupJoinMessage,
  groupJoinCountdown,
  onManualGroupJoin,
  whatsappGroupLink
}) => {
  const navigate = useNavigate();

  const statusConfig = {
    active: {
      iconColor: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/30',
      content: <ContactForm {...{ onSubmitContact, formSubmitting, existingContactNames }} />
    },
    submitted: {
      iconColor: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      message: 'Your contact information has been submitted!',
      additionalMessage: `VCF file will be available after session ends (${expirationTime}).`,
      content: <VcfImportInstructions />
    },
    download: {
      iconColor: 'text-accent',
      bgColor: 'bg-accent/10',
      borderColor: 'border-accent/30',
      content: <DownloadSection onDownload={onDownloadVCF} session={session} />
    },
    expired: {
      iconColor: 'text-destructive',
      bgColor: 'bg-destructive/10',
      borderColor: 'border-destructive/30',
      message: 'This session is permanently closed and contacts are no longer available.'
    },
    unavailable: {
      iconColor: 'text-destructive',
      bgColor: 'bg-destructive/10',
      borderColor: 'border-destructive/30',
      message: 'This session is no longer active or could not be found.'
    }
  };

  const config = statusConfig[sessionStatus] || statusConfig.unavailable;
  const navButton = isCreator ? (
    <Button onClick={() => navigate('/')} className="mt-6">
      <Home className="mr-2 h-4 w-4" /> Get Back Home
    </Button>
  ) : (
    <Button onClick={() => navigate('/')} className="mt-6">
      <ArrowLeft className="mr-2 h-4 w-4" /> Back to Homepage
    </Button>
  );

  return (
    <div>
      {sessionStatus !== 'loading' && (
        <SessionStatusDisplay
          timeLeft={timeLeft}
          status={sessionStatus}
          message={config.message}
          iconColorClass={config.iconColor}
          bgColorClass={config.bgColor}
          borderColorClass={config.borderColor}
          additionalMessage={config.additionalMessage}
        />
      )}

      {showGroupJoinMessage && (
        <GroupJoinSection 
          countdown={groupJoinCountdown} 
          onManualJoin={onManualGroupJoin}
        />
      )}

      {!showGroupJoinMessage && (
        <>
          {config.content}
          {navButton}
        </>
      )}
    </div>
  );
};

export default SessionMainContent;
