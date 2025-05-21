import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Download, XCircle, CheckCircle } from 'lucide-react';

const SessionStatusDisplay = ({ status, timeLeft, message, iconColorClass, bgColorClass, borderColorClass, additionalMessage }) => {
  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  let IconComponent;
  switch(status) {
    case 'active': IconComponent = Clock; break;
    case 'download': IconComponent = Download; break;
    case 'submitted': IconComponent = CheckCircle; break;
    default: IconComponent = XCircle;
  }

  return (
    <motion.div 
      variants={itemVariants} 
      initial="hidden"
      animate="visible"
      className={`text-center mb-6 p-3 rounded-md ${bgColorClass} ${borderColorClass} border`}
    >
      {IconComponent && <IconComponent className={`inline mr-2 h-5 w-5 ${iconColorClass}`} />}
      <span className={`font-semibold ${iconColorClass}`}>{timeLeft || message}</span>
      {message && status !== 'submitted' && <p className="text-sm text-muted-foreground mt-1">{message}</p>}
      {additionalMessage && <p className="text-sm text-muted-foreground mt-1">{additionalMessage}</p>}
    </motion.div>
  );
};

export default SessionStatusDisplay;