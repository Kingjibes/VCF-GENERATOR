
import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

const Header = () => {
  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="py-4 px-6 md:px-12 bg-background/50 backdrop-blur-md shadow-lg sticky top-0 z-40 border-b border-primary/20"
    >
      <div className="container mx-auto flex justify-between items-center">
        <motion.div
          whileHover={{ scale: 1.05, rotate: -2 }}
          className="flex items-center space-x-2 text-xl font-bold tracking-wider"
        >
          <Zap className="h-7 w-7 text-primary animate-pulse" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
            Contact Gain
          </span>
        </motion.div>
        <motion.p 
          className="text-sm font-semibold text-primary"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Made by HACKERPRO
        </motion.p>
      </div>
    </motion.header>
  );
};

export default Header;
  