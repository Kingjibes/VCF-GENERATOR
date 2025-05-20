import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useSessionStore } from '@/hooks/useSessionStore';
import SessionCard from '@/components/SessionCard';
import { useToast } from '@/components/ui/use-toast';
import { PlusCircle, Info, HelpCircle, Copy, Share2, Loader2, Users } from 'lucide-react';

const DURATION_OPTIONS = [
  { value: 5, label: '5 minutes' },
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 360, label: '6 hours' },
  { value: 720, label: '12 hours' },
  { value: 1440, label: '24 hours' },
];

const HomePage = () => {
  const { sessions, createSession, markSessionAsDeletedByUser, loading, fetchSessions } = useSessionStore();
  const [durationIndex, setDurationIndex] = useState(2); 
  const [groupName, setGroupName] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createdSessionLink, setCreatedSessionLink] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const selectedDuration = DURATION_OPTIONS[durationIndex].value;

  const handleCreateSession = async () => {
    if (!groupName.trim()) {
      toast({
        title: 'Group Name Required',
        description: 'Please enter a name for your session group.',
        variant: 'destructive',
      });
      return;
    }
    const newSession = await createSession(selectedDuration, groupName.trim());
    if (newSession && newSession.short_id) {
      const link = `${window.location.origin}/s/${newSession.short_id}`;
      setCreatedSessionLink(link);
      setShowCreateDialog(true);
      toast({
        title: 'Session Created!',
        description: `Session "${groupName.trim()}" active for ${DURATION_OPTIONS[durationIndex].label}. Download link available for 5 hours after expiry.`,
      });
      setGroupName(''); 
    } else if (newSession === null && !loading) {
       toast({
        title: 'Creation Failed',
        description: 'Could not create session. If this persists, the short link generator might be having issues.',
        variant: 'destructive',
      });
    }
  };

  const handleCopyCreatedLink = () => {
    navigator.clipboard.writeText(createdSessionLink)
      .then(() => toast({ title: "Link Copied!", description: "Session link copied to clipboard." }))
      .catch(() => toast({ title: "Error", description: "Failed to copy link.", variant: "destructive" }));
  };

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at));
  }, [sessions]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <motion.div 
      className="container mx-auto py-8 px-4 md:px-0 min-h-[calc(100vh-180px)]"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.section variants={itemVariants} className="mb-12 text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
          Contact Gain VCF Generator
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Effortlessly create temporary sessions with group names, share a unique short link, and collect contacts. Download VCF for 5 hours post-session.
        </p>
      </motion.section>

      <motion.div variants={itemVariants} className="grid md:grid-cols-2 gap-8 mb-12">
        <Card>
          <CardHeader>
            <CardTitle><Info className="inline mr-2 h-6 w-6 text-primary" />About This App</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-2">
            <p>Contact Gain simplifies collecting contact information. Create a session, set its active duration for submissions, and share the link. </p>
            <p>After the submission period ends, the VCF download link remains active for an additional 5 hours for everyone who has the link.</p>
            <p>As a creator, "deleting" a session hides it from your list immediately. The session and its data are permanently deleted from the system 5 hours after the initial submission period ends.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle><HelpCircle className="inline mr-2 h-6 w-6 text-secondary" />How to Use</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-2">
            <ol className="list-decimal list-inside space-y-1">
              <li><strong>Create Session:</strong> Enter group name, set submission duration, click "Create".</li>
              <li><strong>Share Link:</strong> Copy and share the generated short link.</li>
              <li><strong>Collect Contacts:</strong> Participants use the link to submit details during the active period.</li>
              <li><strong>Download VCF:</strong> Anyone with the link can download 'CIPHER.vcf' for 5 hours after the submission period ends.</li>
              <li><strong>Manage Your Sessions:</strong> "Delete" hides a session from your view. It's fully removed later.</li>
            </ol>
          </CardContent>
        </Card>
      </motion.div>

      <motion.section variants={itemVariants} className="mb-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Create a New Contact Collection Session</CardTitle>
            <CardDescription className="text-center">
              Name your group and set how long the contact submission link will be active.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="groupName" className="text-lg block mb-2">Group Name</Label>
              <Input
                id="groupName"
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g., Tech Meetup Attendees"
                className="text-base p-2.5"
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="duration-slider" className="text-lg block text-center mb-2">
                Submission Duration: <span className="font-bold text-primary">{DURATION_OPTIONS[durationIndex].label}</span>
              </Label>
              <Slider
                id="duration-slider"
                min={0}
                max={DURATION_OPTIONS.length - 1}
                step={1}
                value={[durationIndex]}
                onValueChange={(value) => setDurationIndex(value[0])}
                className="w-full"
                disabled={loading}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1 px-1">
                <span>{DURATION_OPTIONS[0].label}</span>
                <span>{DURATION_OPTIONS[DURATION_OPTIONS.length - 1].label}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button size="lg" onClick={handleCreateSession} disabled={loading} className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity text-primary-foreground shadow-lg hover:shadow-primary/50">
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlusCircle className="mr-2 h-5 w-5" />}
              Create New Session
            </Button>
          </CardFooter>
        </Card>
      </motion.section>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center"><Share2 className="mr-2 h-5 w-5 text-primary" />Session Created Successfully!</DialogTitle>
            <DialogDescription>
              Share this short link with others to collect their contact information for group: <strong className="text-primary">{
                  // Find the session by matching the createdSessionLink, since sessions state might not be updated yet
                  // This is a bit of a workaround; ideally, the newSession object would be used directly if available
                  sessions.find(s => createdSessionLink.endsWith(s.short_id))?.group_name || groupName 
              }</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 mt-4">
            <Input
              id="session-link"
              value={createdSessionLink}
              readOnly
              className="flex-1"
            />
            <Button type="button" size="sm" variant="secondary" onClick={handleCopyCreatedLink}>
              <Copy className="h-4 w-4" />
              <span className="sr-only">Copy</span>
            </Button>
          </div>
          <DialogFooter className="sm:justify-start mt-4">
            <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <motion.section variants={itemVariants}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Your Active Sessions</h2>
          <Button variant="outline" onClick={fetchSessions} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
            Refresh Sessions
          </Button>
        </div>
        {loading && sessions.length === 0 ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
          </div>
        ) : !loading && sessions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">You haven't created any sessions yet, or all your sessions have been hidden/fully expired. Create one above to get started!</p>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
          >
            <AnimatePresence>
              {sortedSessions.map(session => (
                <motion.div key={session.id} variants={itemVariants} layout>
                  <SessionCard session={session} onDelete={markSessionAsDeletedByUser} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.section>
    </motion.div>
  );
};

export default HomePage;