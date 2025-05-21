import React from 'react';
import { motion } from 'framer-motion';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users } from 'lucide-react';

const SessionHeader = ({ session, shortId }) => {
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <CardHeader className="text-center">
      <motion.div variants={itemVariants}>
        <Users className="mx-auto h-12 w-12 text-primary mb-4" />
        <CardTitle>Contact Session{session?.group_name ? `: ${session.group_name}` : ''}</CardTitle>
        <CardDescription>
          Session Link ID: {shortId}
        </CardDescription>
      </motion.div>
    </CardHeader>
  );
};

export default SessionHeader;