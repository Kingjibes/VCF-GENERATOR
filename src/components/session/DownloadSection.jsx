import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import VcfImportInstructions from './VcfImportInstructions';

const DownloadSection = ({ onDownload, session }) => {
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  };

  const canDownload = session && session.contacts && session.contacts.length > 0;

  return (
    <motion.div variants={itemVariants} className="text-center py-8">
      <Download className="mx-auto h-16 w-16 text-primary mb-4" />
      <p className="text-2xl font-semibold">Download Contacts</p>
      <p className="text-muted-foreground mb-4">Submissions for this session are closed.</p>
      
      <Button 
        onClick={onDownload} 
        size="lg" 
        disabled={!canDownload}
        className="bg-gradient-to-r from-accent to-secondary hover:opacity-90 transition-opacity text-primary-foreground shadow-lg hover:shadow-accent/50 mb-6"
      >
        <Download className="mr-2 h-5 w-5" /> 
        Download VCF
      </Button>
      
      {!canDownload && (
        <p className="text-sm text-muted-foreground mt-2 mb-4">No contacts were submitted to this session to download.</p>
      )}
      <VcfImportInstructions />
    </motion.div>
  );
};

export default DownloadSection;