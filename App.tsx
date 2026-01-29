import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Home } from './pages/Home';
import { BookingPage } from './pages/BookingPage';
import { AiStylist } from './components/AiStylist';

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
    <Router>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col font-sans text-stone-900">
        <Header />
        {/* pt-20 added to offset the fixed header height */}
        <main className="flex-1 pt-20">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/book/:serviceId" element={<BookingPage />} />
          </Routes>
        </main>
        <Footer />
        <AiStylist />
      </div>
    </Router>
  );
}