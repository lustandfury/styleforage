import React, { useRef, useEffect, useState } from 'react';

// Hero (top of page) – editorial word animation
const HEADING_LINE1 = 'Effortless style for';
const HEADING_LINE2 = 'work & play';
const LINE1_WORDS = HEADING_LINE1.split(' ');
const WORD_REVEAL_DURATION = 0.6;
const WORD_STAGGER = 0.08;
const REVEAL_START_DELAY = 0.35;
/** Ignore scroll below this (px) so restore/rounding on load doesn't cause visible blur */
const SCROLL_DEAD_ZONE = 5;
const SCROLL_BLUR_RANGE = 200;

export type HeroVariant = 'split' | 'centered' | 'typographic';

interface HeroProps {
  variant?: HeroVariant;
}

export const Hero: React.FC<HeroProps> = ({ variant = 'split' }) => {
  const textBlurTopRef = useRef<HTMLDivElement>(null);
  const textBlurBottomRef = useRef<HTMLDivElement>(null);
  const headingWrapperRef = useRef<HTMLDivElement>(null);
  const [headingVisible, setHeadingVisible] = useState(false);
  const [revealDone, setRevealDone] = useState(false);

  // Run scroll-fade-in style on heading container, then start word reveal
  useEffect(() => {
    const id = requestAnimationFrame(() => setHeadingVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Mark reveal done after last word finishes (so rest of hero content can fade in)
  useEffect(() => {
    const totalWords = LINE1_WORDS.length + 1;
    const lastWordDelay = REVEAL_START_DELAY + (totalWords - 1) * WORD_STAGGER;
    const doneAt = (lastWordDelay + WORD_REVEAL_DURATION) * 1000;
    const t = setTimeout(() => setRevealDone(true), doneAt);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let rafId: number | null = null;

    const updateScaleAndBlur = () => {
      const y = window.scrollY;
      const effectiveY = y <= SCROLL_DEAD_ZONE ? 0 : y - SCROLL_DEAD_ZONE;
      const progress = Math.min(effectiveY / (SCROLL_BLUR_RANGE - SCROLL_DEAD_ZONE), 1);

      // Hero text (except heading): blur on scroll
      if (textBlurTopRef.current) {
        textBlurTopRef.current.style.filter = `blur(${progress * 10}px)`;
        if (progress > 0) textBlurTopRef.current.style.opacity = String(1 - progress);
        else textBlurTopRef.current.style.removeProperty('opacity');
      }
      if (textBlurBottomRef.current) {
        textBlurBottomRef.current.style.filter = `blur(${progress * 10}px)`;
        if (progress > 0) textBlurBottomRef.current.style.opacity = String(1 - progress);
        else textBlurBottomRef.current.style.removeProperty('opacity');
      }

      // Heading wrapper: stay full opacity until scrolling content covers hero, then fade
      if (headingWrapperRef.current) {
        const vh = window.innerHeight;
        const minOpacity = 0.2;
        const fadeRange = 150;
        let opacity = 1;
        if (y >= vh) {
          const fadeProgress = Math.min(1, (y - vh) / fadeRange);
          opacity = Math.max(minOpacity, 1 - fadeProgress * (1 - minOpacity));
        }
        headingWrapperRef.current.style.opacity = String(opacity);
      }
    };

    const handleScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateScaleAndBlur);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateScaleAndBlur();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const scrollToServices = () => {
    const element = document.getElementById('services');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Shared heading renderer — fontSize and optional extra className differ per variant
  const renderHeading = (fontSize: string, extraClass = '') => (
    <h2
      className={`scroll-fade-in font-serif font-black text-stone-900 leading-[0.92] tracking-tight ${headingVisible ? 'is-visible' : ''} ${extraClass}`}
      style={{ fontWeight: 900, fontSize }}
    >
      <span className="hero-reveal-line block whitespace-nowrap">
        {LINE1_WORDS.map((word, i) => (
          <span
            key={i}
            className="hero-reveal-word"
            style={{ animationDelay: `${REVEAL_START_DELAY + i * WORD_STAGGER}s` }}
          >
            {word}{i < LINE1_WORDS.length - 1 ? '\u00A0' : ''}
          </span>
        ))}
      </span>
      <span className="hero-reveal-line block whitespace-nowrap">
        <span
          className="hero-reveal-word italic text-sage-600"
          style={{ animationDelay: `${REVEAL_START_DELAY + LINE1_WORDS.length * WORD_STAGGER}s` }}
        >
          {HEADING_LINE2}
        </span>
      </span>
    </h2>
  );

  // ─────────────────────────────────────────────────
  // Variant A: SPLIT — Full-Bleed Editorial Split
  // Aesthetic: Net-a-Porter, Vogue
  // Desktop: 3fr/2fr grid, left col text, right col full-bleed image
  // Mobile: top strip → heading → image → bottom strip
  // ─────────────────────────────────────────────────
  if (variant === 'split') {
    return (
      <section
        className="relative h-full min-h-screen overflow-hidden bg-stone-50"
        aria-label="Hero"
      >
        <h1 className="sr-only">{HEADING_LINE1} {HEADING_LINE2}</h1>

        <div className="md:grid md:grid-cols-[3fr_2fr] h-full">

          {/* Left / main column */}
          <div className="flex flex-col justify-between min-h-screen md:min-h-0 md:h-auto md:justify-start md:gap-20 md:self-center">

            {/* Top editorial strip */}
            <div
              ref={textBlurTopRef}
              className={`hero-rest-in transition-none pt-24 md:pt-28 px-6 md:px-12 lg:px-20 ${revealDone ? 'hero-rest-visible' : ''}`}
            >
              <div className="flex items-center gap-4">
                <span className="text-stone-500 font-sans text-[10px] uppercase tracking-[0.3em] shrink-0">
                  Personal Styling &amp; Wardrobe
                </span>
                <div className="h-px w-8 bg-stone-200 shrink-0" />
                <span className="text-stone-500 font-sans text-[10px] uppercase tracking-[0.3em] shrink-0 hidden sm:inline">
                  Toronto, CA
                </span>
                <div className="h-px flex-1 bg-stone-200" />
              </div>
            </div>

            {/* Heading */}
            <div
              ref={headingWrapperRef}
              className="transition-opacity duration-300 px-6 md:px-12 lg:px-20 py-1 md:py-1"
            >
              {renderHeading('clamp(2rem, 4.5vw, 6.5rem)')}
            </div>

            {/* Mobile-only image (between heading and bottom strip) */}
            <div className="md:hidden h-[45vw] overflow-hidden">
              <img
                src="/images/roz-white-wall.webp"
                alt=""
                className="w-full h-full object-cover object-top"
              />
            </div>

            {/* Bottom editorial strip */}
            <div
              ref={textBlurBottomRef}
              className={`hero-rest-in transition-none px-6 md:px-12 lg:px-20 pb-8 md:pb-12 ${revealDone ? 'hero-rest-visible' : ''}`}
            >
              <div className="border-t border-stone-200 pt-5 md:pt-6 flex flex-col items-start gap-5">
                <p className="text-stone-600 text-sm md:text-base max-w-xs font-sans font-light leading-relaxed">
                  Personal styling for women and men who want to feel confident, current, and completely themselves.
                </p>
                <button
                  onClick={scrollToServices}
                  className="group inline-flex items-center gap-2 text-stone-900 font-sans text-xs uppercase tracking-[0.2em] border-b border-stone-400 pb-0.5 hover:border-sage-500 hover:text-sage-600 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>View Services</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden>→</span>
                </button>
              </div>
            </div>

          </div>

          {/* Right column: full-bleed image (desktop only) */}
          <div className="hidden md:block h-full overflow-hidden">
            <img
              src="/images/roz-white-wall.webp"
              alt=""
              className="h-full w-full object-cover"
            />
          </div>

        </div>
      </section>
    );
  }

  // ─────────────────────────────────────────────────
  // Variant B: CENTERED — Centered Luxury
  // Aesthetic: Céline, The Row — quiet luxury
  // Single centered column, generous vertical breathing room
  // ─────────────────────────────────────────────────
  if (variant === 'centered') {
    return (
      <section
        className="relative h-full min-h-screen overflow-hidden bg-stone-50"
        aria-label="Hero"
      >
        <h1 className="sr-only">{HEADING_LINE1} {HEADING_LINE2}</h1>

        <div className="flex flex-col items-center justify-between h-full min-h-screen">

          {/* Top metadata strip — centered */}
          <div
            ref={textBlurTopRef}
            className={`hero-rest-in transition-none w-full pt-24 md:pt-28 px-6 md:px-12 lg:px-20 ${revealDone ? 'hero-rest-visible' : ''}`}
          >
            <div className="flex items-center justify-center gap-4">
              <div className="h-px w-16 bg-stone-200 shrink-0" />
              <span className="text-stone-500 font-sans text-[10px] uppercase tracking-[0.3em] shrink-0">
                Personal Styling &amp; Wardrobe
              </span>
              <div className="h-px w-4 bg-stone-200 shrink-0" />
              <span className="text-stone-500 font-sans text-[10px] uppercase tracking-[0.3em] shrink-0 hidden sm:inline">
                Toronto, CA
              </span>
              <div className="h-px w-16 bg-stone-200 shrink-0" />
            </div>
          </div>

          {/* Centered heading + portrait */}
          <div
            ref={headingWrapperRef}
            className="transition-opacity duration-300 flex flex-col items-center gap-6 px-6 md:px-12 lg:px-20 py-4 text-center"
          >
            {renderHeading('clamp(2.75rem, 10vw, 7rem)', 'text-center')}
            <img
              src="/images/roz-transparent.webp"
              alt=""
              className="mx-auto max-w-[180px] sm:max-w-xs h-auto"
            />
          </div>

          {/* Bottom CTA — centered */}
          <div
            ref={textBlurBottomRef}
            className={`hero-rest-in transition-none w-full px-6 md:px-12 lg:px-20 pb-8 md:pb-12 ${revealDone ? 'hero-rest-visible' : ''}`}
          >
            <div className="border-t border-stone-200 pt-5 md:pt-6 flex flex-col items-center gap-4">
              <p className="text-stone-600 text-sm md:text-base max-w-md font-sans font-light leading-relaxed text-center">
                Personal styling for women and men who want to feel confident, current, and completely themselves.
              </p>
              <button
                onClick={scrollToServices}
                className="group inline-flex items-center gap-2 text-stone-900 font-sans text-xs uppercase tracking-[0.2em] border-b border-stone-400 pb-0.5 hover:border-sage-500 hover:text-sage-600 transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>View Services</span>
                <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden>→</span>
              </button>
            </div>
          </div>

        </div>
      </section>
    );
  }

  // ─────────────────────────────────────────────────
  // Variant C: TYPOGRAPHIC — Typographic Drama
  // Aesthetic: Jacquemus, Bottega Veneta — high-fashion editorial
  // Oversized heading dominates; small accent image to its right (desktop)
  // ─────────────────────────────────────────────────
  return (
    <section
      className="relative h-full min-h-screen overflow-hidden bg-stone-50"
      aria-label="Hero"
    >
      <h1 className="sr-only">{HEADING_LINE1} {HEADING_LINE2}</h1>

      <div className="flex flex-col justify-between h-full min-h-screen">

        {/* Top editorial strip */}
        <div
          ref={textBlurTopRef}
          className={`hero-rest-in transition-none pt-24 md:pt-28 px-6 md:px-12 lg:px-20 ${revealDone ? 'hero-rest-visible' : ''}`}
        >
          <div className="flex items-center gap-4">
            
            <span className="text-stone-500 font-sans text-[10px] uppercase tracking-[0.3em] shrink-0">
              Personal Styling &amp; Wardrobe
            </span>
            <div className="h-px w-8 bg-stone-200 shrink-0" />
            <span className="text-stone-500 font-sans text-[10px] uppercase tracking-[0.3em] shrink-0 hidden sm:inline">
              Toronto, CA
            </span>
            <div className="h-px flex-1 bg-stone-200" /> 
          </div>
        </div>

        {/* Oversized heading + desktop accent image */}
        <div
          ref={headingWrapperRef}
          className="transition-opacity duration-300 flex-1 flex items-end px-6 md:px-12 lg:px-20 pb-4 md:pb-6"
        >
          <div className="flex items-end gap-4 md:gap-8 w-full">
            {/* Heading: dominant element */}
            <div className="flex-1 min-w-0">
              {renderHeading('clamp(3.5rem, 13vw, 9rem)')}
            </div>
            {/* Desktop-only accent image, ~28% width, baseline-aligned */}
            <div className="hidden md:block w-[28%] shrink-0 self-end">
              <img
                src="/images/roz-transparent.webp"
                alt=""
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>

        {/* Mobile-only accent image */}
        <div className="md:hidden flex justify-center px-6 pb-2">
          <img
            src="/images/roz-transparent.webp"
            alt=""
            className="w-[50vw] h-auto"
          />
        </div>

        {/* Bottom editorial strip */}
        <div
          ref={textBlurBottomRef}
          className={`hero-rest-in transition-none px-6 md:px-12 lg:px-20 pb-8 md:pb-12 ${revealDone ? 'hero-rest-visible' : ''}`}
        >
          <div className="border-t border-stone-200 pt-5 md:pt-6 flex flex-col sm:flex-row sm:items-end justify-between gap-5 sm:gap-8">
            <p className="text-stone-600 text-sm md:text-base max-w-md font-sans font-light leading-relaxed">
              Personal styling for women and men who want to feel confident, current, and completely themselves.
            </p>
            <button
              onClick={scrollToServices}
              className="group inline-flex items-center gap-2 text-stone-900 font-sans text-xs uppercase tracking-[0.2em] border-b border-stone-400 pb-0.5 hover:border-sage-500 hover:text-sage-600 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>View Services</span>
              <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden>→</span>
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
