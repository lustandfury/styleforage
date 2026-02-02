import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { id: 'about', label: 'About' },
  { id: 'services', label: 'Services' },
  { id: 'testimonials', label: 'Testimonials' },
  { id: 'contact', label: 'Contact', path: '/contact' },
] as const;

const SCROLL_THRESHOLD = 100;
const MOUSE_TOP_ZONE = 120;

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [hasScrolledOnce, setHasScrolledOnce] = useState(false);
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [isMouseNearTop, setIsMouseNearTop] = useState(false);
  const [activeNav, setActiveNav] = useState<string | null>(null);

  const showLogoAndCta = !isScrolledDown || isMouseNearTop;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > 0) setHasScrolledOnce(true);
      setIsScrolledDown(currentScrollY > SCROLL_THRESHOLD);

      const viewportMid = currentScrollY + window.innerHeight * 0.35;
      const getTop = (id: string) => {
        const el = document.getElementById(id);
        return el ? el.getBoundingClientRect().top + window.scrollY : Infinity;
      };
      const aboutTop = getTop('about');
      const servicesTop = getTop('services');
      const testimonialsTop = getTop('testimonials');
      if (viewportMid < aboutTop) setActiveNav(null);
      else if (viewportMid < servicesTop) setActiveNav('about');
      else if (viewportMid < testimonialsTop) setActiveNav('services');
      else setActiveNav('testimonials');
    };

    const handleMouseMove = (e: MouseEvent) => {
      setIsMouseNearTop(e.clientY < MOUSE_TOP_ZONE);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

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
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-stone-900 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500"
      >
        Skip to main content
      </a>
      <header className="fixed top-0 z-40 w-full bg-transparent border-b border-transparent transition-all duration-300">
        <div className="w-full px-3 md:px-12 lg:px-20 h-20 grid grid-cols-3 items-center gap-2">
          <div
            className={`justify-self-start transition-opacity duration-300 min-w-0 ${
              showLogoAndCta ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <Link
              to="/"
              className="font-serif text-xl md:text-2xl font-semibold tracking-tight text-stone-900 hover:text-stone-700 transition-colors cursor-pointer truncate"
            >
              Style Forage
            </Link>
          </div>

          {/* Pill-style nav: flat by default, liquid glass after first scroll (top on all screen sizes) */}
          <nav className="flex justify-self-center min-w-0">
            <div
              className={`nav-pill inline-flex items-center gap-0.5 p-1 rounded-full flex-nowrap ${
                hasScrolledOnce ? 'nav-pill-glass' : 'nav-pill-flat'
              }`}
            >
              {NAV_ITEMS.map((item) => {
                const isActive = 'path' in item ? location.pathname === item.path : activeNav === item.id;
                if ('path' in item) {
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      className={`nav-link-item relative px-2 py-1.5 text-xs font-medium rounded-full cursor-pointer touch-manipulation md:px-4 md:py-2 md:text-sm ${
                        isActive
                          ? 'nav-link-item--active text-stone-900'
                          : 'text-stone-600 hover:text-stone-800 active:text-stone-800'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                }
                return (
                  <button
                    key={item.id}
                    onClick={() => scrollToAnchor(item.id)}
                    className={`nav-link-item relative px-2 py-1.5 text-xs font-medium rounded-full cursor-pointer touch-manipulation md:px-4 md:py-2 md:text-sm ${
                      isActive
                        ? 'nav-link-item--active text-stone-900'
                        : 'text-stone-600 hover:text-stone-800 active:text-stone-800'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </nav>

          <div
            className={`justify-self-end transition-opacity duration-300 shrink-0 ${
              showLogoAndCta ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <Button
              variant="primary"
              size="md"
              onClick={() => scrollToAnchor('services')}
              className="px-4 md:px-6 rounded-full text-sm md:text-base"
            >
              Book Now
            </Button>
          </div>
        </div>
      </header>
    </>
  );
};