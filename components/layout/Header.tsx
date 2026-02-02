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
        <div className="w-full px-4 md:px-12 lg:px-20 h-20 grid grid-cols-2 md:grid-cols-3 items-center">
          <div
            className={`justify-self-start transition-opacity duration-300 ${
              showLogoAndCta ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <Link
              to="/"
              className="font-serif text-2xl font-semibold tracking-tight text-stone-900 hover:text-stone-700 transition-colors cursor-pointer"
            >
              Style Forage
            </Link>
          </div>

          {/* Pill-style nav: flat by default, liquid glass after first scroll */}
          <nav className="hidden md:flex justify-self-center">
            <div
              className={`nav-pill inline-flex items-center gap-0.5 p-1 rounded-full ${
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
                      className={`nav-link-item relative px-4 py-2 text-sm font-medium rounded-full cursor-pointer ${
                        isActive
                          ? 'nav-link-item--active text-stone-900'
                          : 'text-stone-600 hover:text-stone-800'
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
                    className={`nav-link-item relative px-4 py-2 text-sm font-medium rounded-full cursor-pointer ${
                      isActive
                        ? 'nav-link-item--active text-stone-900'
                        : 'text-stone-600 hover:text-stone-800'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </nav>

          <div
            className={`justify-self-end transition-opacity duration-300 ${
              showLogoAndCta ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <Button
              variant="primary"
              size="md"
              onClick={() => scrollToAnchor('services')}
              className="px-6 rounded-full"
            >
              Book Now
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile: bottom nav bar (native-app style), 20px from bottom */}
      <nav
        className="fixed bottom-2 left-0 right-0 z-40 flex md:hidden justify-center px-4 pt-3 pb-[max(20px,env(safe-area-inset-bottom))]"
        aria-label="Main navigation"
      >
        <div
          className={`nav-pill inline-flex items-center gap-0.5 p-1 rounded-full ${
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
                  className={`nav-link-item relative px-4 py-2.5 text-sm font-medium rounded-full cursor-pointer touch-manipulation ${
                    isActive
                      ? 'nav-link-item--active text-stone-900'
                      : 'text-stone-600 active:text-stone-800'
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
                className={`nav-link-item relative px-4 py-2.5 text-sm font-medium rounded-full cursor-pointer touch-manipulation ${
                  isActive
                    ? 'nav-link-item--active text-stone-900'
                    : 'text-stone-600 active:text-stone-800'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};