import React from 'react';
import { CardFooter } from '@/components/ui/card';

const SessionFooterInfo = ({ session, sessionStatus, userSubmitted }) => {
  if (!session) return null;

  const showFooter = (sessionStatus === 'active' || sessionStatus === 'download') && !userSubmitted;

  if (!showFooter) return null;

  return (
    <CardFooter className="text-xs text-muted-foreground text-center block pt-4">
      {sessionStatus === 'active' && <p>Your information will be shared with the session creator.</p>}
      <p>Session created at: {new Date(session.created_at || session.createdAt).toLocaleString()}</p>
      {sessionStatus === 'active' && <p>Submissions close at: {new Date(session.expires_at || session.expiresAt).toLocaleString()}</p>}
      {sessionStatus === 'download' && <p>Download link active until: {new Date(session.deletion_scheduled_at || session.deletionScheduledAt).toLocaleString()}</p>}
    </CardFooter>
  );
};

export default SessionFooterInfo;