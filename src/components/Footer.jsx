
import React from 'react';
import { motion } from 'framer-motion';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <motion.footer
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="py-6 px-6 md:px-12 mt-12 bg-background/30 backdrop-blur-sm border-t border-primary/10"
    >
      <div className="container mx-auto text-center">
        <p className="text-sm text-muted-foreground">
          &copy; {currentYear} HACKERPRO. All rights reserved.
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Contact Gain VCF Generator - Streamlining Connections
        </p>
      </div>
    </motion.footer>
  );
};

export default Footer;
  