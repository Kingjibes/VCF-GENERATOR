import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useSessionStore } from '@/hooks/useSessionStore';
import SessionCard from '@/components/SessionCard';
import SessionStatsOverview from '@/components/SessionStatsOverview';
import { PlusCircle, Loader2, Info, CalendarDays, Users, Link2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const ONE_WEEK_IN_MINUTES = 7 * 24 * 60;

const HomePage = () => {
  const { sessions, loading, createSession, markSessionAsDeletedByUser } = useSessionStore();
  const [sessionDuration, setSessionDuration] = useState(ONE_WEEK_IN_MINUTES);
  const [groupName, setGroupName] = useState('');
  const [whatsappGroupLink, setWhatsappGroupLink] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCreateSession = async () => {
    if (!groupName.trim()) {
      toast({ title: "Group Name Required", description: "Please enter a name for your session group.", variant: "destructive" });
      return;
    }
    if (!whatsappGroupLink.trim()) {
        toast({ title: "WhatsApp Link Required", description: "Please enter the WhatsApp group link.", variant: "destructive" });
        return;
    }
    if (!whatsappGroupLink.startsWith('https://chat.whatsapp.com/')) {
        toast({ title: "Invalid WhatsApp Link", description: "Please enter a valid WhatsApp group link (e.g., https://chat.whatsapp.com/...).", variant: "destructive" });
        return;
    }

    setIsCreating(true);
    const newSession = await createSession(sessionDuration, groupName.trim(), whatsappGroupLink.trim());
    if (newSession) {
      toast({ title: "Session Created!", description: `Session "${newSession.group_name}" is now active.` });
      setGroupName('');
      setWhatsappGroupLink('');
      setSessionDuration(ONE_WEEK_IN_MINUTES);
    }
    setIsCreating(false);
  };

  const handleDeleteSession = async (sessionId) => {
    await markSessionAsDeletedByUser(sessionId);
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    out: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes} min`;
    if (minutes < 1440) return `${(minutes / 60).toFixed(1)} hours`;
    return `${(minutes / 1440).toFixed(1)} days`;
  };

  return (
    <motion.div 
      className="container mx-auto py-8 px-4"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
    >
      <motion.section variants={itemVariants} className="mb-12">
        <Card className="bg-gradient-to-br from-card to-card/80 backdrop-blur-sm shadow-xl border-primary/20">
          <CardHeader>
            <CardTitle className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary">Create New Contact Session</CardTitle>
            <CardDescription className="text-muted-foreground text-lg">
              Set up a new session to collect contacts. Share the generated link with participants.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="groupName" className="text-lg font-medium flex items-center">
                <Users className="mr-2 h-5 w-5 text-primary" /> Group Name
              </Label>
              <Input 
                id="groupName" 
                type="text" 
                value={groupName} 
                onChange={(e) => setGroupName(e.target.value)} 
                placeholder="e.g., Project Alpha Team, Conference Attendees" 
                className="text-lg p-3 bg-background/70 border-border focus:border-primary focus:shadow-[0_0_15px_hsl(var(--primary)/0.5)] transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsappGroupLink" className="text-lg font-medium flex items-center">
                <Link2 className="mr-2 h-5 w-5 text-primary" /> WhatsApp Group Link
              </Label>
              <Input 
                id="whatsappGroupLink" 
                type="url" 
                value={whatsappGroupLink} 
                onChange={(e) => setWhatsappGroupLink(e.target.value)} 
                placeholder="https://chat.whatsapp.com/YourGroupInvite" 
                className="text-lg p-3 bg-background/70 border-border focus:border-primary focus:shadow-[0_0_15px_hsl(var(--primary)/0.5)] transition-all"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Important: Participants will be prompted to join this group after submitting their details. The VCF file will be shared here, ensuring only verified participants (those who submitted contacts) get access.
              </p>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="duration" className="text-lg font-medium flex items-center">
                <CalendarDays className="mr-2 h-5 w-5 text-primary" /> Session Duration: <span className="text-primary font-semibold ml-2">{formatDuration(sessionDuration)}</span>
              </Label>
              <Slider 
                id="duration"
                min={10} 
                max={ONE_WEEK_IN_MINUTES * 2} 
                step={10} 
                value={[sessionDuration]} 
                onValueChange={(value) => setSessionDuration(value[0])}
                className="[&>span:first-child]:h-3 [&>span:first-child]:w-3 [&_[role=slider]]:bg-primary [&_[role=slider]]:shadow-[0_0_10px_hsl(var(--primary)/0.7)]"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>10 min</span>
                <span>{formatDuration(ONE_WEEK_IN_MINUTES * 2)} (2 weeks)</span>
              </div>
            </div>

            <Button onClick={handleCreateSession} disabled={isCreating || !groupName.trim() || !whatsappGroupLink.trim()} size="lg" className="w-full text-lg py-3 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity text-primary-foreground shadow-lg hover:shadow-primary/50">
              {isCreating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlusCircle className="mr-2 h-5 w-5" />}
              Create Session
            </Button>
          </CardContent>
        </Card>
      </motion.section>

      {sessions && sessions.length > 0 && (
        <SessionStatsOverview sessions={sessions} />
      )}

      <motion.section variants={itemVariants}>
        <h1 className="text-3xl font-bold mb-8 tracking-tight text-center bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary">Your Active Sessions</h1>
        {loading && sessions.length === 0 ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <motion.div 
            variants={itemVariants} 
            className="text-center py-10 px-6 bg-card/50 rounded-xl shadow-md border border-border"
          >
            <Info className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground">No active sessions found.</p>
            <p className="text-sm text-muted-foreground mt-1">Create a new session above to get started!</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map(session => (
              <SessionCard key={session.id} session={session} onDelete={handleDeleteSession} />
            ))}
          </div>
        )}
      </motion.section>
    </motion.div>
  );
};

export default HomePage;
