import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion, AnimatePresence } from 'framer-motion';

const HomePage = lazy(() => import('@/pages/HomePage'));
const SessionPage = lazy(() => import('@/pages/SessionPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

const AppLayout = () => (
  <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-background to-slate-900/50">
    <Header />
    <main className="flex-grow">
      <AnimatePresence mode="wait">
        <Outlet />
      </AnimatePresence>
    </main>
    <Footer />
  </div>
);

const LoadingFallback = () => (
  <div className="flex justify-center items-center h-screen">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full"
    />
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            {/* Route for full UUID, kept for any old links or direct access if needed */}
            <Route path="/session/:sessionId" element={<SessionPage />} /> 
            {/* New route for short IDs */}
            <Route path="/s/:shortId" element={<SessionPage />} /> 
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
      <Toaster />
    </Router>
  );
}

export default App;