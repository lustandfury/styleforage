import React, { useRef, useEffect, useState } from 'react';

const HEADING_LINE1 = 'Effortless style for';
const HEADING_LINE2 = 'work & play';
const LINE1_WORDS = HEADING_LINE1.split(' ');
const WORD_REVEAL_DURATION = 0.6;
const WORD_STAGGER = 0.08;
const REVEAL_START_DELAY = 0.35;
const SCROLL_DEAD_ZONE = 5;
const SCROLL_BLUR_RANGE = 200;

export const Hero: React.FC = () => {
  const textBlurTopRef = useRef<HTMLDivElement>(null);
  const textBlurBottomRef = useRef<HTMLDivElement>(null);
  const headingWrapperRef = useRef<HTMLDivElement>(null);
  const [headingVisible, setHeadingVisible] = useState(false);
  const [revealDone, setRevealDone] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setHeadingVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const totalWords = LINE1_WORDS.length + 1;
    const lastWordDelay = REVEAL_START_DELAY + (totalWords - 1) * WORD_STAGGER;
    const doneAt = (lastWordDelay + WORD_REVEAL_DURATION) * 1000;
    const t = setTimeout(() => setRevealDone(true), doneAt);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let rafId: number | null = null;

    const updateBlur = () => {
      const y = window.scrollY;
      const effectiveY = y <= SCROLL_DEAD_ZONE ? 0 : y - SCROLL_DEAD_ZONE;
      const progress = Math.min(effectiveY / (SCROLL_BLUR_RANGE - SCROLL_DEAD_ZONE), 1);

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
      if (headingWrapperRef.current) {
        const vh = window.innerHeight;
        const fadeRange = 150;
        let opacity = 1;
        if (y >= vh) {
          const fadeProgress = Math.min(1, (y - vh) / fadeRange);
          opacity = Math.max(0.2, 1 - fadeProgress * 0.8);
        }
        headingWrapperRef.current.style.opacity = String(opacity);
      }
    };

    const handleScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateBlur);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateBlur();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const scrollToServices = () => {
    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative h-full min-h-screen overflow-hidden bg-stone-50" aria-label="Hero">
      <h1 className="sr-only">{HEADING_LINE1} {HEADING_LINE2}</h1>

      <div className="md:grid md:grid-cols-[3fr_2fr] h-full">

        {/* Left column */}
        <div className="flex flex-col justify-between h-screen md:h-auto md:min-h-0 md:justify-start md:gap-20 md:self-center">

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
            className="transition-opacity duration-300 px-6 md:px-12 lg:px-20 py-1"
          >
            <h2
              className={`scroll-fade-in font-serif font-black text-stone-900 leading-[0.92] tracking-tight ${headingVisible ? 'is-visible' : ''}`}
              style={{ fontWeight: 900, fontSize: 'clamp(2rem, 5.5vw, 6.5rem)' }}
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
          </div>

          {/* Mobile image — flex-1 fills the space between heading and bottom strip */}
          <div className="md:hidden flex-1 min-h-0 overflow-hidden">
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
              <p className="text-stone-600 text-sm md:text-base max-w-md font-sans font-light leading-relaxed">
                Personal styling for women and men who want to feel confident, current, and completely themselves.
              </p>
              <button
                onClick={scrollToServices}
                className="group inline-flex items-center gap-2 text-stone-900 font-sans text-xs uppercase tracking-[0.2em] border-b border-stone-400 pb-0.5 hover:border-sage-500 hover:text-sage-600 transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>View Services</span>
                <span className="transition-transform duration-300 group-hover:translate-y-1" aria-hidden>↓</span>
              </button>
            </div>
          </div>

        </div>

        {/* Right column: full-bleed image, desktop only */}
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
};
