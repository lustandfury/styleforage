import React, { useRef, useEffect, useState } from 'react';
import { Button } from '../ui/Button';

const HEADING_LINE1 = 'Effortless style for every';
const HEADING_LINE2 = ' body & budget';
const FULL_HEADING = HEADING_LINE1 + HEADING_LINE2;

export const Hero: React.FC = () => {
  const bgRef = useRef<HTMLDivElement>(null);
  const textBlurTopRef = useRef<HTMLDivElement>(null);
  const textBlurBottomRef = useRef<HTMLDivElement>(null);
  const [visibleLength, setVisibleLength] = useState(0);
  const [typewriterDone, setTypewriterDone] = useState(false);

  // Typewriter: type out heading, then mark done so rest of text can transition
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const startDelay = setTimeout(() => {
      intervalId = setInterval(() => {
        setVisibleLength((n) => {
          if (n >= FULL_HEADING.length) {
            if (intervalId) clearInterval(intervalId);
            setTypewriterDone(true);
            return n;
          }
          return n + 1;
        });
      }, 38);
    }, 350);
    return () => {
      clearTimeout(startDelay);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    let rafId: number | null = null;
    
    const updateScaleAndBlur = () => {
      const scrollY = window.scrollY;
      const progress = Math.min(scrollY / 500, 1);

      // Background: scale 1.1 → 1.0, blur, and opacity 1 → 0 on scroll (same 0–500px range)
      if (bgRef.current) {
        const scale = 1.1 - progress * 0.1;
        bgRef.current.style.transform = `scale3d(${scale}, ${scale}, 1)`;
        bgRef.current.style.filter = `blur(${progress * 10}px)`;
        bgRef.current.style.opacity = String(1 - progress);
      }

      // Hero text (except heading): blur on scroll; opacity only when scrolled (so initial fade-up animation can run)
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

  return (
    <section
      className="relative h-full min-h-screen flex flex-col items-center justify-center overflow-hidden"
      aria-label="Hero"
    >
      {/* Background: slightly scaled by default (0.92), fades to 1.0 on scroll */}
      <div 
        ref={bgRef}
        className="absolute inset-0 bg-cover bg-center bg-no-repeat hero-zoom-bg rounded-[4px]"
        style={{
          backgroundImage: "url('/images/clothing rack full width.webp')",
          transform: 'scale3d(1.05, 1.05, 1)',
        }}
        aria-hidden="true"
      />
      <h1 className="sr-only">Effortless style for every body and budget</h1>

      {/* Hero text content: heading types out, then rest transition in. Badge above heading in layout. */}
      <div className="relative z-10 flex flex-col items-center md:items-start justify-center px-4 md:px-12 lg:px-20 w-full">
        <div className="text-center md:text-left max-w-5xl">
          <div ref={textBlurTopRef} className={`hero-rest-in transition-none ${typewriterDone ? 'hero-rest-visible' : ''}`}>
            <div className="inline-block px-4 py-1.5 mb-4 md:mb-6 rounded-full backdrop-blur-sm border border-stone-900/10 text-stone-900 text-xs font-bold uppercase tracking-[0.2em]">
              Personal Styling & Wardrobe Curation
            </div>
          </div>
          <h2 className="hero-heading-in relative font-serif text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-medium text-stone-900 mb-6 md:mb-8 tracking-tight leading-[1.1]">
            {/* Hidden full text reserves height so layout doesn't jump */}
            <span aria-hidden="true" className="invisible block">
              {HEADING_LINE1}
              <br />
              <span className="italic text-stone-700">{HEADING_LINE2}</span>
            </span>
            {/* Typing text overlaid so it matches reserved space */}
            <span className="absolute inset-0">
              {FULL_HEADING.slice(0, Math.min(visibleLength, HEADING_LINE1.length))}
              {visibleLength > HEADING_LINE1.length && (
                <>
                  <br />
                  <span className="italic text-stone-700">
                    {FULL_HEADING.slice(HEADING_LINE1.length, visibleLength)}
                  </span>
                </>
              )}
            </span>
          </h2>
          <div ref={textBlurBottomRef} className={`hero-rest-in transition-none ${typewriterDone ? 'hero-rest-visible' : ''}`}>
            <p className="text-stone-700 text-base sm:text-lg md:text-2xl max-w-2xl mx-auto md:mx-0 mb-10 md:mb-12 leading-relaxed font-light">
              Personal styling for women and men who want to feel confident, current, and completely themselves.
            </p>
            <div className="flex justify-center md:justify-start">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto px-10 rounded-full shadow-lg"
                onClick={scrollToServices}
              >
                View Services
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
