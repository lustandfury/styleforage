import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Button } from '../ui/Button';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

type NavItemBase = {
  id: string;
  label: string;
  description: string;
};
type NavItemAnchor = NavItemBase & { path: string };
type NavItemButton = NavItemBase & { path?: never };
type NavItem = NavItemAnchor | NavItemButton;

const NAV_ITEMS: NavItem[] = [
  { id: 'about', label: 'About', description: 'Meet your stylist' },
  { id: 'services', label: 'Services', description: 'What we offer' },
  { id: 'testimonials', label: 'Testimonials', description: 'What clients say' },
  { id: 'contact', label: 'Contact', description: 'Get in touch', path: '/contact' },
];

const SCROLL_THRESHOLD = 100;
/** Scroll distance (px) over which mobile pill backgrounds fade from transparent to full opacity */
const PILL_FADE_SCROLL = 120;
/** Scroll distance (px) over which original wordmark/Book Now fade up and pill versions fade down */
const HEADER_FADE_SCROLL = 120;

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [hasScrolledOnce, setHasScrolledOnce] = useState(false);
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [activeNav, setActiveNav] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pillBgOpacity, setPillBgOpacity] = useState(0);
  const [headerFadeProgress, setHeaderFadeProgress] = useState(0);
  const [hoveredNavId, setHoveredNavId] = useState<string | null>(null);
  const [aboutSection90InView, setAboutSection90InView] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isNavDark, setIsNavDark] = useState(false);
  const [pillPosition, setPillPosition] = useState<{ left: number; width: number; top: number; height: number } | null>(null);
  const navItemsContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLSpanElement | null>>({});

  const showLogoAndCta = !isScrolledDown;
  // About indicator only when About section is 90% in view; other items use activeNav as usual
  const effectiveActiveNav =
    activeNav === 'about' ? (aboutSection90InView ? 'about' : null) : activeNav;
  const selectedNavId =
    hoveredNavId ?? effectiveActiveNav ?? (aboutSection90InView ? 'about' : null);
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
      setHeaderFadeProgress(Math.min(1, currentScrollY / HEADER_FADE_SCROLL));

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

      // About section "90% in view": section top is at or above 10% from viewport top
      const aboutEl = document.getElementById('about');
      const vh = window.innerHeight;
      setAboutSection90InView(
        !!aboutEl && aboutEl.getBoundingClientRect().top <= vh * 0.1
      );

      // Detect if nav is over a dark-background section
      const NAV_HEIGHT = 80;
      const darkSections = document.querySelectorAll('[data-nav-theme="dark"]');
      let overDark = false;
      darkSections.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < NAV_HEIGHT && rect.bottom > 0) overDark = true;
      });
      setIsNavDark(overDark);
    };

    const media = window.matchMedia('(max-width: 767px)');
    const setMobile = () => setIsMobile(media.matches);
    setMobile();
    media.addEventListener('change', setMobile);

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      media.removeEventListener('change', setMobile);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const updatePillPosition = () => {
    const container = navItemsContainerRef.current;
    const item = selectedNavId ? itemRefs.current[selectedNavId] : null;
    if (!container || !item) {
      setPillPosition(null);
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    setPillPosition({
      left: itemRect.left - containerRect.left,
      width: itemRect.width,
      top: itemRect.top - containerRect.top,
      height: itemRect.height,
    });
  };

  useLayoutEffect(() => {
    updatePillPosition();
  }, [selectedNavId, isScrolledDown]);

  useEffect(() => {
    const onScrollOrResize = () => updatePillPosition();
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [selectedNavId]);

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
      <header className="fixed top-0 z-40 w-full border-b border-transparent transition-all duration-300">
        <div className="container mx-auto px-4 h-20 grid grid-cols-3 items-center gap-2">
          <div
            className="justify-self-start min-w-0 md:transition-none"
            style={
              !isMobile
                ? {
                    opacity: 1 - headerFadeProgress,
                    transform: `translateY(${-headerFadeProgress * 16}px)`,
                    pointerEvents: headerFadeProgress >= 1 ? 'none' : undefined,
                  }
                : undefined
            }
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
                className={`font-serif text-xl md:text-2xl font-bold tracking-[2px] transition-colors duration-300 cursor-pointer truncate uppercase ${
                  isNavDark && !showPillBg ? 'text-white hover:text-white/80' : 'text-stone-900 hover:text-stone-700'
                }`}
                style={{ fontWeight: 700 }}
              >
                STYLE FORAGE
              </Link>
            </span>
          </div>

          {/* Pill-style nav: desktop only; when scrolled, wordmark + nav items + Book Now inside pill */}
          <div className="min-w-0 w-0 overflow-hidden md:w-auto md:overflow-visible md:flex justify-self-center">
            <nav className="hidden md:flex justify-self-center min-w-0" aria-label="Main navigation">
              <div
                className={`nav-pill relative inline-flex items-center w-full max-w-3xl gap-0 px-3 py-1.5 rounded-full flex-nowrap transition-all duration-300 ease-out ${
                  isScrolledDown ? 'nav-pill-glass' : 'nav-pill-flat'
                }`}
              >
              {/* Wordmark: fade down on scroll (desktop); baseline aligned with nav items */}
              <span
                className="overflow-hidden shrink-0 flex justify-start"
                style={{
                  opacity: headerFadeProgress,
                  transform: `translateY(${(1 - headerFadeProgress) * 10}px)`,
                  transition: 'none',
                  pointerEvents: headerFadeProgress >= 1 ? 'auto' : 'none',
                }}
              >
                <Link
                  to="/"
                  className={`nav-link-item relative px-5 py-2 text-sm font-bold tracking-[2px] rounded-full cursor-pointer font-serif whitespace-nowrap inline-block leading-none uppercase transition-colors duration-300 ${
                    isNavDark ? 'text-white hover:text-white/80' : 'text-stone-900 hover:text-stone-700'
                  }`}
                  style={{ fontWeight: 700 }}
                >
                  STYLE FORAGE
                </Link>
              </span>
              {/* Nav items: centered in the pill; sliding background moves to hovered/active item */}
              <div
                ref={navItemsContainerRef}
                className={`flex-1 flex justify-center items-baseline gap-1 min-w-0 shrink relative ${selectedNavId ? 'has-sliding-pill' : ''}`}
              >
                {pillPosition && (
                  <span
                    className="nav-sliding-pill absolute rounded-full border border-black bg-white/95 pointer-events-none z-0 transition-[left,width,top,height] duration-200 ease-out"
                    style={{
                      left: pillPosition.left,
                      width: pillPosition.width,
                      top: pillPosition.top,
                      height: pillPosition.height,
                    }}
                    aria-hidden
                  />
                )}
                {NAV_ITEMS.map((item) => {
                  const isActive = 'path' in item ? location.pathname === item.path : activeNav === item.id;
                  if ('path' in item) {
                    return (
                      <span
                        key={item.id}
                        ref={(el) => { itemRefs.current[item.id] = el; }}
                        className="relative z-10 inline-block"
                        onMouseEnter={() => setHoveredNavId(item.id)}
                        onMouseLeave={() => setHoveredNavId(null)}
                      >
                        <Link
                          to={item.path}
                          className={`nav-link-item relative px-4 py-1.5 text-xs font-sans uppercase tracking-[0.12em] rounded-full cursor-pointer block transition-colors duration-300 ${
                            isActive
                              ? 'nav-link-item--active text-stone-900'
                              : isNavDark ? 'text-white/70 hover:text-white' : 'text-stone-600 hover:text-stone-800'
                          }`}
                        >
                          {item.label}
                        </Link>
                      </span>
                    );
                  }
                  return (
                    <span
                      key={item.id}
                      ref={(el) => { itemRefs.current[item.id] = el; }}
                      className="relative z-10 inline-block"
                      onMouseEnter={() => setHoveredNavId(item.id)}
                      onMouseLeave={() => setHoveredNavId(null)}
                    >
                      <button
                        type="button"
                        onClick={() => scrollToAnchor(item.id)}
                        className={`nav-link-item relative px-4 py-1.5 text-xs font-sans uppercase tracking-[0.12em] rounded-full cursor-pointer transition-colors duration-300 ${
                          isActive
                            ? 'nav-link-item--active text-stone-900'
                            : isNavDark ? 'text-white/70 hover:text-white' : 'text-stone-600 hover:text-stone-800'
                        }`}
                      >
                        {item.label}
                      </button>
                    </span>
                  );
                })}
              </div>
              {/* Book Now: fade down on scroll; fixed space, aligned end */}
              <span
                className="min-w-[6.5rem] overflow-hidden shrink-0 flex justify-end ml-6"
                style={{
                  opacity: headerFadeProgress,
                  transform: `translateY(${(1 - headerFadeProgress) * 10}px)`,
                  transition: 'none',
                  pointerEvents: headerFadeProgress >= 1 ? 'auto' : 'none',
                }}
              >
                <button
                  type="button"
                  onClick={() => scrollToAnchor('services')}
                  className={`nav-link-item relative px-5 py-2 text-sm font-medium rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-sage-500 focus:ring-offset-2 focus:ring-offset-transparent transition-colors duration-300 whitespace-nowrap inline-block ${
                    isNavDark
                      ? 'bg-white text-stone-900 hover:bg-sage-100'
                      : 'bg-stone-900 text-white hover:bg-sage-500 hover:text-white'
                  }`}
                >
                  Book Now
                </button>
              </span>
              </div>
            </nav>
          </div>

          <div className="flex justify-self-end shrink-0 items-center gap-2">
            {/* Mobile: menu button (top right) */}
            <button
              type="button"
              className={`md:hidden px-3 py-1.5 rounded-full focus:outline-none focus:ring-2 focus:ring-sage-500 focus:ring-offset-2 cursor-pointer transition-colors duration-300 touch-manipulation ${
                isNavDark && !showPillBg
                  ? 'text-white hover:bg-white/10'
                  : 'text-stone-700 hover:bg-stone-200/80 hover:text-stone-900'
              }`}
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
            {/* Desktop: Book Now – fades up on scroll */}
            <div
              className="hidden md:block md:transition-none"
              style={
                !isMobile
                  ? {
                      opacity: 1 - headerFadeProgress,
                      transform: `translateY(${-headerFadeProgress * 16}px)`,
                      pointerEvents: headerFadeProgress >= 1 ? 'none' : undefined,
                    }
                  : undefined
              }
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

      {/* Mobile menu: full-screen overlay */}
      <div
        className={`fixed inset-0 z-50 md:hidden flex flex-col mobile-menu-leather transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        role="dialog"
        aria-modal
        aria-label="Navigation menu"
        aria-hidden={!isMobileMenuOpen}
      >
        {/* Menu header row: logo + close */}
        <div className="flex items-center justify-between px-6 h-20 shrink-0 border-b border-sage-700">
          <Link
            to="/"
            onClick={closeMobileMenu}
            className="font-serif text-xl font-bold tracking-[2px] text-white uppercase cursor-pointer"
            style={{ fontWeight: 700 }}
          >
            STYLE FORAGE
          </Link>
          <button
            type="button"
            onClick={closeMobileMenu}
            className="p-2 -mr-1 rounded-full text-sage-300 hover:bg-sage-800 cursor-pointer transition-colors"
            aria-label="Close menu"
          >
            <X size={24} aria-hidden />
          </button>
        </div>

        {/* Nav items — vertically centered, staggered animation */}
        <nav className="flex-1 flex flex-col justify-center px-6 md:px-10" aria-label="Main navigation">
          {NAV_ITEMS.map((item, i) => {
            const isActive = 'path' in item ? location.pathname === item.path : activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavAction(item)}
                className={`group w-full flex items-center justify-between py-5 border-b border-sage-700/50 text-left cursor-pointer touch-manipulation transition-[opacity,transform] duration-500 ${
                  isMobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: isMobileMenuOpen ? `${i * 60 + 50}ms` : '0ms' }}
              >
                <div className="flex items-baseline gap-4 min-w-0">
                  <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-sage-500 shrink-0 tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <span className={`font-serif block leading-none transition-colors duration-200 ${isActive ? 'text-white' : 'text-white/80 group-hover:text-white'}`}
                      style={{ fontSize: 'clamp(1.6rem, 6vw, 2.4rem)', fontWeight: 700 }}
                    >{item.label}</span>
                    <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-sage-400 block mt-1">{item.description}</span>
                  </div>
                </div>
                <span className="text-sage-500 text-xl transition-transform duration-300 group-hover:translate-x-1 shrink-0 ml-4" aria-hidden>→</span>
              </button>
            );
          })}
        </nav>

        {/* Book Now — animates in last */}
        <div
          className={`px-6 pb-12 pt-8 shrink-0 transition-[opacity,transform] duration-500 ${
            isMobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: isMobileMenuOpen ? `${NAV_ITEMS.length * 60 + 50}ms` : '0ms' }}
        >
          <button
            type="button"
            className="w-full py-4 font-sans text-xs uppercase tracking-[0.2em] font-medium border border-white/20 text-white hover:bg-white hover:text-sage-900 transition-colors cursor-pointer"
            onClick={() => {
              closeMobileMenu();
              scrollToAnchor('services');
            }}
          >
            Book Now
          </button>
        </div>
      </div>
    </>
  );
};