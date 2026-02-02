import React, { useRef, useEffect, useState } from 'react';
import { Button } from '../ui/Button';

const HEADING_LINE1 = 'Effortless style for every';
const HEADING_LINE2 = 'body & budget';
const LINE1_WORDS = HEADING_LINE1.split(' ');
const WORD_REVEAL_DURATION = 0.6;
const WORD_STAGGER = 0.08;
const REVEAL_START_DELAY = 0.35;

export const Hero: React.FC = () => {
  const bgRef = useRef<HTMLDivElement>(null);
  const textBlurTopRef = useRef<HTMLDivElement>(null);
  const textBlurBottomRef = useRef<HTMLDivElement>(null);
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
      const scrollY = window.scrollY;
      const progress = Math.min(scrollY / 200, 1);

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
          <div ref={textBlurTopRef} className={`hero-rest-in transition-none ${revealDone ? 'hero-rest-visible' : ''}`}>
            <div className="inline-block px-4 py-1.5 mb-4 md:mb-6 rounded-full backdrop-blur-sm border border-stone-900/10 text-stone-900 text-xs font-bold uppercase tracking-[0.2em]">
              Personal Styling & Wardrobe Curation
            </div>
          </div>
          <h2 className={`scroll-fade-in relative font-serif text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-medium text-stone-900 mb-6 md:mb-8 tracking-tight leading-[1.1] ${headingVisible ? 'is-visible' : ''}`}>
            {/* Line 1: staggered word reveal */}
            <span className="hero-reveal-line block">
              {LINE1_WORDS.map((word, i) => (
                <span
                  key={i}
                  className="hero-reveal-word"
                  style={{
                    animationDelay: `${REVEAL_START_DELAY + i * WORD_STAGGER}s`,
                  }}
                >
                  {word}{i < LINE1_WORDS.length - 1 ? '\u00A0' : ''}
                </span>
              ))}
            </span>
            {/* Line 2: single phrase with delay */}
            <span className="hero-reveal-line block">
              <span
                className="hero-reveal-word italic text-stone-700"
                style={{
                  animationDelay: `${REVEAL_START_DELAY + LINE1_WORDS.length * WORD_STAGGER}s`,
                }}
              >
                {HEADING_LINE2}
              </span>
            </span>
          </h2>
          <div ref={textBlurBottomRef} className={`hero-rest-in transition-none ${revealDone ? 'hero-rest-visible' : ''}`}>
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
