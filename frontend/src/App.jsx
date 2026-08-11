import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import ErrorBoundary from './components/ErrorBoundary';

import SplashScreen from './pages/SplashScreen';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import DatasetPreview from './pages/DatasetPreview';
import QualityReport from './pages/QualityReport';
import Recommendations from './pages/Recommendations';
import CleaningDashboard from './pages/CleaningDashboard';
import Visualizations from './pages/Visualizations';
import BeforeAfter from './pages/BeforeAfter';
import DownloadPage from './pages/Download';
import ModelInsights from './pages/ModelInsights';
import Settings from './pages/Settings';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import useAppStore from './store/useAppStore';

function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      style={{ height: '100%' }}
    >
      {children}
    </motion.div>
  );
}

function Layout({ children }) {
  const { sidebarCollapsed } = useAppStore();
  const sidebarW = sidebarCollapsed ? 72 : 260;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F7F6F3]">
      <Sidebar />
      <div
        className="flex flex-col flex-1 overflow-hidden transition-all duration-400 relative z-10"
        style={{ marginLeft: sidebarW }}
      >
        <TopBar />
        <main
          className="flex-1 overflow-auto"
          style={{ paddingTop: '80px', padding: '100px 40px 40px' }}
        >
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/"                element={<SplashScreen />} />
        <Route path="/dashboard"       element={<Layout><Dashboard /></Layout>} />
        <Route path="/upload"          element={<Layout><Upload /></Layout>} />
        <Route path="/preview"         element={<Layout><DatasetPreview /></Layout>} />
        <Route path="/quality"         element={<Layout><QualityReport /></Layout>} />
        <Route path="/recommendations" element={<Layout><Recommendations /></Layout>} />
        <Route path="/clean"           element={<Layout><CleaningDashboard /></Layout>} />
        <Route path="/visualizations"  element={<Layout><Visualizations /></Layout>} />
        <Route path="/before-after"    element={<Layout><BeforeAfter /></Layout>} />
        <Route path="/download"        element={<Layout><DownloadPage /></Layout>} />
        <Route path="/model-insights"  element={<Layout><ModelInsights /></Layout>} />
        <Route path="/settings"        element={<Layout><Settings /></Layout>} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#FFFFFF',
            color: '#2D3748',
            border: '1px solid #E2E8F0',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '13px',
            fontWeight: '600',
            borderRadius: '9999px',
            padding: '12px 24px',
            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)',
          },
        }}
      />
      <AnimatedRoutes />
    </BrowserRouter>
    </ErrorBoundary>
  );
}
