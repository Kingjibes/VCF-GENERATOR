import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import SessionStatusDisplay from '@/components/session/SessionStatusDisplay';
import ContactForm from '@/components/session/ContactForm';
import DownloadSection from '@/components/session/DownloadSection';
import VcfImportInstructions from '@/components/session/VcfImportInstructions';

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
  existingContactNames
}) => {
  const navigate = useNavigate();

  let content;
  let statusProps = { 
    timeLeft, 
    status: sessionStatus, 
    message: '', 
    iconColorClass: '', 
    bgColorClass: '', 
    borderColorClass: '',
    additionalMessage: '' 
  };

  switch (sessionStatus) {
    case 'active':
      statusProps.iconColorClass = 'text-primary';
      statusProps.bgColorClass = 'bg-primary/10';
      statusProps.borderColorClass = 'border-primary/30';
      content = (
        <>
          <SessionStatusDisplay {...statusProps} />
          <ContactForm 
            onSubmit={onSubmitContact} 
            formSubmitting={formSubmitting} 
            existingContactNames={existingContactNames} 
          />
        </>
      );
      break;
    case 'submitted':
      statusProps.message = 'Your contact information has been submitted!';
      statusProps.iconColorClass = 'text-green-500';
      statusProps.bgColorClass = 'bg-green-500/10';
      statusProps.borderColorClass = 'border-green-500/30';
      statusProps.timeLeft = ''; 
      statusProps.additionalMessage = `You can come back after the session ends (around ${expirationTime}) to download the VCF file.`;
      content = (
        <>
          <SessionStatusDisplay {...statusProps} />
          <VcfImportInstructions />
          {isCreator && <Button onClick={() => navigate('/')} className="mt-6"><Home className="mr-2 h-4 w-4" /> Get Back Home</Button>}
          {!isCreator && 
            <Button onClick={() => navigate('/')} className="mt-6">
              <Home className="mr-2 h-4 w-4" /> Got it, I'll Come Back Later
            </Button>
          }
        </>
      );
      break;
    case 'download':
      statusProps.iconColorClass = 'text-accent';
      statusProps.bgColorClass = 'bg-accent/10';
      statusProps.borderColorClass = 'border-accent/30';
      content = (
        <>
          <SessionStatusDisplay {...statusProps} />
          <DownloadSection onDownload={onDownloadVCF} session={session} />
          <Button onClick={() => navigate('/')} className="mt-6">
            <Home className="mr-2 h-4 w-4" /> {isCreator ? 'Get Back Home' : 'Come Back'}
          </Button>
        </>
      );
      break;
    case 'expired':
    case 'unavailable':
    default:
      statusProps.status = sessionStatus === 'expired' ? 'expired' : 'unavailable';
      statusProps.message = sessionStatus === 'expired' ? 'This session is permanently closed and contacts are no longer available.' : 'This session is no longer active or could not be found.';
      statusProps.timeLeft = '';
      statusProps.iconColorClass = 'text-destructive';
      statusProps.bgColorClass = 'bg-destructive/10';
      statusProps.borderColorClass = 'border-destructive/30';
      content = (
        <>
          <SessionStatusDisplay {...statusProps} />
          <Button onClick={() => navigate('/')} className="mt-6">
            <Home className="mr-2 h-4 w-4" /> {isCreator ? 'Get Back Home' : 'Go to Home'}
          </Button>
        </>
      );
      break;
  }

  return <div>{content}</div>;
};

export default SessionMainContent;
