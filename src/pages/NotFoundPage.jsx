
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <motion.div 
      className="flex flex-col items-center justify-center min-h-[calc(100vh-180px)] text-center px-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
    >
      <AlertTriangle className="h-24 w-24 text-destructive mb-8 animate-bounce" />
      <h1 className="text-6xl font-extrabold text-destructive mb-4">404</h1>
      <h2 className="text-3xl font-semibold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Page Not Found</h2>
      <p className="text-lg text-muted-foreground mb-8 max-w-md">
        Oops! The page you're looking for doesn't exist. It might have been moved, deleted, or maybe you mistyped the URL.
      </p>
      <Button asChild size="lg" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity text-primary-foreground shadow-lg hover:shadow-primary/50">
        <Link to="/">
          Go Back to Homepage
        </Link>
      </Button>
    </motion.div>
  );
};

export default NotFoundPage;
  