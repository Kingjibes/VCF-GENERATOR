 import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Users as GroupIcon, CheckCircle, Download, ArrowLeft } from 'lucide-react';
import SessionStatusDisplay from '@/components/session/SessionStatusDisplay';
import ContactForm from '@/components/session/ContactForm';
import DownloadSection from '@/components/session/DownloadSection';
import VcfImportInstructions from '@/components/session/VcfImportInstructions';
import { motion } from 'framer-motion';

const GroupJoinSection = ({ countdown, onManualJoin, link }) => (
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
    <Button onClick={onManualJoin} variant="outline" className="mb-2 border-green-500 text-green-600 hover:bg-green-500/20">
      <GroupIcon className="mr-2 h-4 w-4" /> Join WhatsApp Group Now
    </Button>
    <p className="text-xs text-muted-foreground">
      Or, you'll be redirected automatically in <span className="font-bold text-green-600 dark:text-green-500">{countdown}</span> seconds...
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

  let mainContent;
  let statusDisplayProps = { 
    timeLeft, 
    status: sessionStatus, 
    message: '', 
    iconColorClass: '', 
    bgColorClass: '', 
    borderColorClass: '',
    additionalMessage: '' 
  };

  let navigationButton = null;

  switch (sessionStatus) {
    case 'active':
      statusDisplayProps.iconColorClass = 'text-primary';
      statusDisplayProps.bgColorClass = 'bg-primary/10';
      statusDisplayProps.borderColorClass = 'border-primary/30';
      mainContent = (
        <ContactForm 
          onSubmit={onSubmitContact} 
          formSubmitting={formSubmitting} 
          existingContactNames={existingContactNames} 
        />
      );
      break;
    case 'submitted':
      statusDisplayProps.message = 'Your contact information has been submitted!';
      statusDisplayProps.iconColorClass = 'text-green-500';
      statusDisplayProps.bgColorClass = 'bg-green-500/10';
      statusDisplayProps.borderColorClass = 'border-green-500/30';
      statusDisplayProps.timeLeft = ''; 
      statusDisplayProps.additionalMessage = `The VCF file will be available for download or shared in the group after the session ends (around ${expirationTime}).`;
      mainContent = <VcfImportInstructions />;
      if (isCreator) {
        navigationButton = (
          <Button onClick={() => navigate('/')} className="mt-6">
            <Home className="mr-2 h-4 w-4" /> Get Back Home
          </Button>
        );
      }
      break;
    case 'download':
      statusDisplayProps.iconColorClass = 'text-accent';
      statusDisplayProps.bgColorClass = 'bg-accent/10';
      statusDisplayProps.borderColorClass = 'border-accent/30';
      mainContent = <DownloadSection onDownload={onDownloadVCF} session={session} />;
      if (isCreator) {
        navigationButton = (
          <Button onClick={() => navigate('/')} className="mt-6">
            <Home className="mr-2 h-4 w-4" /> Get Back Home
          </Button>
        );
      } else {
        navigationButton = (
          <Button onClick={() => navigate('/')} className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Homepage
          </Button>
        );
      }
      break;
    case 'expired':
    case 'unavailable':
    default:
      statusDisplayProps.status = sessionStatus === 'expired' ? 'expired' : 'unavailable';
      statusDisplayProps.message = sessionStatus === 'expired' ? 'This session is permanently closed and contacts are no longer available.' : 'This session is no longer active or could not be found.';
      statusDisplayProps.timeLeft = '';
      statusDisplayProps.iconColorClass = 'text-destructive';
      statusDisplayProps.bgColorClass = 'bg-destructive/10';
      statusDisplayProps.borderColorClass = 'border-destructive/30';
      mainContent = null;
      if (isCreator) {
        navigationButton = (
          <Button onClick={() => navigate('/')} className="mt-6">
            <Home className="mr-2 h-4 w-4" /> Get Back Home
          </Button>
        );
      } else {
        navigationButton = (
          <Button onClick={() => navigate('/')} className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Homepage
          </Button>
        );
      }
      break;
  }

  return (
    <div>
      {sessionStatus !== 'loading' && <SessionStatusDisplay {...statusDisplayProps} />}
      
      {showGroupJoinMessage && whatsappGroupLink && (
        <GroupJoinSection 
          countdown={groupJoinCountdown} 
          onManualJoin={onManualGroupJoin}
          link={whatsappGroupLink}
        />
      )}

      {!showGroupJoinMessage && mainContent}
      {!showGroupJoinMessage && navigationButton}
    </div>
  );
};

export default SessionMainContent;
