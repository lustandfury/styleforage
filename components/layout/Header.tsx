import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, Shirt, MessageCircle, Mail } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type NavItemBase = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
};
type NavItemAnchor = NavItemBase & { path: string };
type NavItemButton = NavItemBase & { path?: never };
type NavItem = NavItemAnchor | NavItemButton;

const NAV_ITEMS: NavItem[] = [
  { id: 'about', label: 'About', description: 'Meet your stylist', icon: User },
  { id: 'services', label: 'Services', description: 'What we offer', icon: Shirt },
  { id: 'testimonials', label: 'Testimonials', description: 'What clients say', icon: MessageCircle },
  { id: 'contact', label: 'Contact', description: 'Get in touch', path: '/contact', icon: Mail },
];

const SCROLL_THRESHOLD = 100;
const MOUSE_TOP_ZONE = 120;
/** Scroll distance (px) over which mobile pill backgrounds fade from transparent to full opacity */
const PILL_FADE_SCROLL = 120;

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [hasScrolledOnce, setHasScrolledOnce] = useState(false);
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [isMouseNearTop, setIsMouseNearTop] = useState(false);
  const [activeNav, setActiveNav] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pillBgOpacity, setPillBgOpacity] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const showLogoAndCta = !isScrolledDown || isMouseNearTop;
  const showPillBg = isMobile && hasScrolledOnce;

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleNavAction = (item: NavItem) => {
    closeMobileMenu();
    if ('path' in item) {
      navigate(item.path);
    } else {
      scrollToAnchor(item.id);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > 0) setHasScrolledOnce(true);
      setIsScrolledDown(currentScrollY > SCROLL_THRESHOLD);
      setPillBgOpacity(Math.min(1, currentScrollY / PILL_FADE_SCROLL));

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

    const media = window.matchMedia('(max-width: 767px)');
    const setMobile = () => setIsMobile(media.matches);
    setMobile();
    media.addEventListener('change', setMobile);

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    handleScroll();
    return () => {
      media.removeEventListener('change', setMobile);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobileMenu();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

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
      <header
        className={`fixed top-0 z-40 w-full border-b border-transparent transition-all duration-300 ${
          hasScrolledOnce ? 'md:bg-white/95 md:border-stone-200 md:shadow-sm' : ''
        }`}
      >
        <div className="w-full px-3 md:px-12 lg:px-20 h-20 grid grid-cols-3 items-center gap-2">
          <div
            className={`justify-self-start transition-opacity duration-300 min-w-0 ${
              showLogoAndCta ? 'opacity-100' : 'opacity-100 md:opacity-0 md:pointer-events-none'
            }`}
          >
            <span
              className={`inline-block transition-all duration-300 ${
                hasScrolledOnce ? 'rounded-full px-3 py-2 md:bg-transparent md:rounded-none md:px-0 md:py-0' : ''
              }`}
              style={
                showPillBg
                  ? {
                      backgroundColor: `rgba(255,255,255,${pillBgOpacity * 0.95})`,
                    }
                  : undefined
              }
            >
              <Link
                to="/"
                className="font-serif text-xl md:text-2xl font-semibold tracking-tight text-stone-900 hover:text-stone-700 transition-colors cursor-pointer truncate"
              >
                Style Forage
              </Link>
            </span>
          </div>

          {/* Pill-style nav: desktop only; wrapper keeps grid column on mobile so menu stays right */}
          <div className="min-w-0 w-0 overflow-hidden md:w-auto md:overflow-visible md:flex justify-self-center">
            <nav className="hidden md:flex justify-self-center min-w-0">
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
          </div>

          <div className="flex justify-self-end shrink-0 items-center gap-2">
            {/* Mobile: menu button (top right) */}
            <button
              type="button"
              className="md:hidden px-3 py-2 rounded-full text-stone-700 hover:bg-stone-200/80 hover:text-stone-900 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:ring-offset-2 cursor-pointer transition-colors duration-200 touch-manipulation"
              style={
                showPillBg
                  ? { backgroundColor: `rgba(255,255,255,${pillBgOpacity * 0.95})` }
                  : undefined
              }
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMobileMenuOpen ? <X size={24} aria-hidden /> : <Menu size={24} aria-hidden />}
            </button>
            {/* Desktop: Book Now */}
            <div
              className={`hidden md:block transition-opacity duration-300 ${
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
        </div>
      </header>

      {/* Mobile menu: overlay + panel (only visible when open) */}
      <div
        className="fixed inset-0 z-30 md:hidden"
        aria-hidden={!isMobileMenuOpen}
        style={{ pointerEvents: isMobileMenuOpen ? undefined : 'none' }}
      >
        <button
          type="button"
          className={`absolute inset-0 bg-stone-900/40 transition-opacity cursor-default ${
            isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={closeMobileMenu}
          aria-label="Close menu"
        />
        <div
          className={`absolute top-20 left-4 right-4 rounded-2xl bg-white shadow-xl border border-stone-200 overflow-hidden transition-all duration-200 ${
            isMobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
          }`}
          role="dialog"
          aria-label="Navigation menu"
        >
          <div className="p-3 space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive = 'path' in item ? location.pathname === item.path : activeNav === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavAction(item)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors cursor-pointer touch-manipulation ${
                    isActive
                      ? 'bg-sage-50 text-sage-900'
                      : 'text-stone-700 hover:bg-stone-100 active:bg-stone-100'
                  }`}
                >
                  <span className="flex shrink-0 w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center" aria-hidden>
                    <Icon size={20} className="text-stone-600" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-stone-900 block">{item.label}</span>
                    <span className="text-sm text-stone-500 block">{item.description}</span>
                  </div>
                </button>
              );
            })}
            <div className="pt-3 mt-2 border-t border-stone-200">
              <Button
                variant="primary"
                size="md"
                className="w-full rounded-xl"
                onClick={() => {
                  closeMobileMenu();
                  scrollToAnchor('services');
                }}
              >
                Book Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};