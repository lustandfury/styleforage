import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/Home').then(module => ({ default: module.Home })));
const Contact = lazy(() => import('./pages/Contact').then(module => ({ default: module.Contact })));
const BookingPage = lazy(() => import('./pages/BookingPage').then(module => ({ default: module.BookingPage })));
const AiStylist = lazy(() => import('./components/AiStylist').then(module => ({ default: module.AiStylist })));

/** Set to true to show the AI Stylist chat on non-booking pages */
const SHOW_AI_CHAT = false;

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

// Layout component that conditionally renders header/footer based on route
const AppLayout = () => {
  const location = useLocation();
  
  // Check if we're on a booking page - hide nav for focused checkout experience
  const isBookingFlow = location.pathname.startsWith('/book/');
  // Home page has hero that extends behind the header, so no padding needed
  const isHomePage = location.pathname === '/';
  
  return (
    <div className="min-h-screen flex flex-col font-sans text-stone-900">
      {!isBookingFlow && <Header />}
      {/* pt-20 added to offset the fixed header height, except on home page where hero overlays header */}
      <main
        id="main-content"
        className={`flex-1 min-h-[70vh] ${!isBookingFlow && !isHomePage ? 'pt-20' : ''} ${!isBookingFlow ? 'pb-0' : ''}`}
        tabIndex={-1}
      >
        <Suspense fallback={<div className="min-h-[50vh]" aria-hidden="true" />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/book/:serviceId" element={<BookingPage />} />
          </Routes>
        </Suspense>
      </main>
      {!isBookingFlow && <Footer />}
      {SHOW_AI_CHAT && !isBookingFlow && (
        <Suspense fallback={null}>
          <AiStylist />
        </Suspense>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <ScrollToTop />
        <AppLayout />
      </Router>
    </ErrorBoundary>
  );
}