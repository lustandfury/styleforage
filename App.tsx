import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/Home').then(module => ({ default: module.Home })));
const BookingPage = lazy(() => import('./pages/BookingPage').then(module => ({ default: module.BookingPage })));
const AiStylist = lazy(() => import('./components/AiStylist').then(module => ({ default: module.AiStylist })));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-sage-200 border-t-sage-500 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-stone-500 text-sm">Loading...</p>
    </div>
  </div>
);

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  
  React.useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.substring(1));
      if (element) {
        // Delay slightly for elements that might not be rendered yet
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);
  
  return null;
};

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col font-sans text-stone-900">
          <Header />
          {/* pt-20 added to offset the fixed header height */}
          <main id="main-content" className="flex-1 pt-20" tabIndex={-1}>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/book/:serviceId" element={<BookingPage />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
          <Suspense fallback={null}>
            <AiStylist />
          </Suspense>
        </div>
      </Router>
    </ErrorBoundary>
  );
}