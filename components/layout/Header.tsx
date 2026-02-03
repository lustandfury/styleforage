import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
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
        <div className="w-full px-3 md:px-12 lg:px-20 h-20 grid grid-cols-3 items-center gap-2">
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
                className="font-serif text-xl md:text-2xl font-semibold tracking-tight text-stone-900 hover:text-stone-700 transition-colors cursor-pointer truncate"
              >
                Style Forage
              </Link>
            </span>
          </div>

          {/* Pill-style nav: desktop only; when scrolled, wordmark + nav items + Book Now inside pill */}
          <div className="min-w-0 w-0 overflow-hidden md:w-auto md:overflow-visible md:flex justify-self-center">
            <nav className="hidden md:flex justify-self-center min-w-0" aria-label="Main navigation">
              <div
                className={`nav-pill relative inline-flex items-baseline w-full max-w-3xl gap-0 px-3 py-2 rounded-full flex-nowrap transition-all duration-300 ease-out ${
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
                  className="nav-link-item relative px-5 py-2.5 text-xl font-semibold rounded-full cursor-pointer text-stone-900 hover:text-stone-700 font-serif tracking-tight whitespace-nowrap inline-block leading-none"
                >
                  Style Forage
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
                          className={`nav-link-item relative px-4 py-2 text-sm font-medium rounded-full cursor-pointer block ${
                            isActive
                              ? 'nav-link-item--active text-stone-900'
                              : 'text-stone-600 hover:text-stone-800'
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
                        className={`nav-link-item relative px-5 py-2.5 text-sm font-medium rounded-full cursor-pointer ${
                          isActive
                            ? 'nav-link-item--active text-stone-900'
                            : 'text-stone-600 hover:text-stone-800'
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
                className="min-w-[6.5rem] overflow-hidden shrink-0 flex justify-end"
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
                  className="nav-link-item relative px-5 py-2.5 text-sm font-medium rounded-full cursor-pointer bg-stone-900 text-white hover:bg-sage-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-sage-500 focus:ring-offset-2 focus:ring-offset-transparent transition-colors whitespace-nowrap inline-block"
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