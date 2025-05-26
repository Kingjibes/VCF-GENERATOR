import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, BarChart3, Star, Briefcase } from 'lucide-react';

const StatCard = ({ title, value, icon, color }) => {
  const IconComponent = icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex-1 min-w-[200px]"
    >
      <Card className={`shadow-lg border-transparent border-l-4 ${color}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <IconComponent className={`h-5 w-5 ${color ? color.replace('border-l-', 'text-') : 'text-primary'}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
            {value}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const SessionStatsOverview = ({ sessions }) => {
  if (!sessions || sessions.length === 0) {
    return null;
  }

  const totalContactsCollected = sessions.reduce((acc, session) => {
    const count = session.contactCount !== undefined ? session.contactCount : (session.contacts && session.contacts[0] ? session.contacts[0].count : 0);
    return acc + count;
  }, 0);

  const averageContactsPerSession = sessions.length > 0 
    ? (totalContactsCollected / sessions.length).toFixed(1) 
    : 0;

  const mostActiveSession = sessions.reduce((max, session) => {
    const currentCount = session.contactCount !== undefined ? session.contactCount : (session.contacts && session.contacts[0] ? session.contacts[0].count : 0);
    const maxCount = max.contactCount !== undefined ? max.contactCount : (max.contacts && max.contacts[0] ? max.contacts[0].count : 0);
    return currentCount > maxCount ? session : max;
  }, sessions[0]);
  
  const mostActiveSessionName = mostActiveSession?.group_name || 'N/A';
  const mostActiveSessionContacts = mostActiveSession ? (mostActiveSession.contactCount !== undefined ? mostActiveSession.contactCount : (mostActiveSession.contacts && mostActiveSession.contacts[0] ? mostActiveSession.contacts[0].count : 0)) : 0;

  const totalSessions = sessions.length;

  const topSessionsForChart = [...sessions]
    .sort((a, b) => {
      const countA = a.contactCount !== undefined ? a.contactCount : (a.contacts && a.contacts[0] ? a.contacts[0].count : 0);
      const countB = b.contactCount !== undefined ? b.contactCount : (b.contacts && b.contacts[0] ? b.contacts[0].count : 0);
      return countB - countA;
    })
    .slice(0, 5);
  
  const maxContactsInChart = Math.max(...topSessionsForChart.map(s => s.contactCount !== undefined ? s.contactCount : (s.contacts && s.contacts[0] ? s.contacts[0].count : 0)), 1);


  const sectionVariants = {
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
    <motion.section 
      className="mb-12 p-6 bg-card/20 backdrop-blur-md rounded-xl shadow-xl border border-primary/10"
      variants={sectionVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h2 
        className="text-2xl font-bold mb-6 tracking-tight text-center bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary"
        variants={itemVariants}
      >
        Stats At a Glance
      </motion.h2>
      
      <motion.div 
        className="flex flex-wrap gap-4 mb-8 justify-center"
        variants={sectionVariants}
      >
        <StatCard title="Total Contacts" value={totalContactsCollected} icon={Users} color="border-l-primary" />
        <StatCard title="Total Sessions" value={totalSessions} icon={Briefcase} color="border-l-secondary" />
        <StatCard title="Avg Contacts/Session" value={averageContactsPerSession} icon={TrendingUp} color="border-l-accent" />
        <StatCard title="Most Active Session" value={`${mostActiveSessionName} (${mostActiveSessionContacts})`} icon={Star} color="border-l-yellow-400" />
      </motion.div>

      {topSessionsForChart.length > 0 && (
        <motion.div variants={itemVariants}>
          <h3 className="text-xl font-semibold mb-4 text-center text-primary">Top Sessions by Contacts</h3>
          <div className="space-y-3 p-4 bg-background/50 rounded-lg">
            {topSessionsForChart.map((session, index) => {
              const contactCount = session.contactCount !== undefined ? session.contactCount : (session.contacts && session.contacts[0] ? session.contacts[0].count : 0);
              const barWidth = contactCount > 0 ? (contactCount / maxContactsInChart) * 100 : 0;
              return (
                <motion.div 
                  key={session.id || index} 
                  className="flex items-center"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 + 0.5, type: 'spring', stiffness: 50 }}
                >
                  <span className="w-1/3 truncate text-sm text-muted-foreground pr-2">{session.group_name}</span>
                  <div className="w-2/3 bg-muted rounded-full h-6 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary to-secondary flex items-center justify-end pr-2"
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 0.8, ease: "circOut", delay: index * 0.1 + 0.7 }}
                    >
                      <span className="text-xs font-medium text-primary-foreground pl-2">{contactCount}</span>
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.section>
  );
};

export default SessionStatsOverview;
