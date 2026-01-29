import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show header if at the very top, or scrolling up
      // Hide header if scrolling down and past a small threshold
      if (currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const scrollToAnchor = (id: string) => {
    if (location.pathname !== '/') {
      navigate(`/#${id}`);
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Skip Navigation Link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-stone-900 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500"
      >
        Skip to main content
      </a>
      <header 
        className={`fixed top-0 z-40 w-full backdrop-blur-md bg-white/95 border-b border-stone-100 shadow-sm transition-transform duration-500 ease-in-out ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="container mx-auto px-4 h-20 grid grid-cols-2 md:grid-cols-3 items-center">
        {/* Logo */}
        <div className="justify-self-start">
          <Link to="/" className="font-serif text-2xl font-semibold tracking-tight text-stone-900 hover:text-stone-700 transition-colors cursor-pointer">
            Style Forage
          </Link>
        </div>

        {/* Centered Navigation */}
        <nav className="hidden md:flex gap-10 text-sm font-semibold text-stone-500 justify-self-center uppercase tracking-widest">
          <button 
            onClick={() => scrollToAnchor('about')} 
            className="hover:text-sage-600 transition-colors py-2 cursor-pointer"
          >
            About
          </button>
          <button 
            onClick={() => scrollToAnchor('services')} 
            className="hover:text-sage-600 transition-colors py-2 cursor-pointer"
          >
            Services
          </button>
          <button 
            onClick={() => scrollToAnchor('testimonials')} 
            className="hover:text-sage-600 transition-colors py-2 cursor-pointer"
          >
            Testimonials
          </button>
        </nav>

        {/* Action Button */}
        <div className="justify-self-end">
          <Button size="md" onClick={() => scrollToAnchor('services')} className="px-6 rounded-full">
            Book Now
          </Button>
        </div>
        </div>
      </header>
    </>
  );
};