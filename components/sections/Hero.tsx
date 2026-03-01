import React, { useRef, useEffect, useState } from 'react';

const HEADING_LINE1 = 'Effortless style for';
const HEADING_LINE2 = 'work & play';
const LINE1_WORDS = HEADING_LINE1.split(' ');
const WORD_REVEAL_DURATION = 0.6;
const WORD_STAGGER = 0.08;
const REVEAL_START_DELAY = 0.35;
const SCROLL_DEAD_ZONE = 5;
const SCROLL_BLUR_RANGE = 200;
const HERO_SUBHEADING = "The boardroom, the weekend, the trip you haven't packed for yet. Consider it handled.";
const HERO_SUBHEADING_WORDS = HERO_SUBHEADING.split(' ');
const SUBHEADING_WORD_STAGGER = 0.022; // Match About section word cadence
const SUBHEADING_START_DELAY = 0.25;

function subheadingWordStyle(inView: boolean, globalIndex: number) {
  const delay = SUBHEADING_START_DELAY + globalIndex * SUBHEADING_WORD_STAGGER;
  return {
    opacity: inView ? 1 : 0,
    transform: inView ? 'none' : 'translateY(5px)',
    transition: inView
      ? `opacity 0.4s ease ${delay}s, transform 0.4s ease ${delay}s`
      : 'none',
  } as React.CSSProperties;
}

export const Hero: React.FC = () => {
  const textBlurTopRef    = useRef<HTMLDivElement>(null);
  const textBlurBottomRef = useRef<HTMLDivElement>(null);
  const headingWrapperRef = useRef<HTMLDivElement>(null);
  const winterImg1Ref     = useRef<HTMLImageElement>(null);
  const winterImg2Ref     = useRef<HTMLImageElement>(null);
  const winterImg3Ref     = useRef<HTMLImageElement>(null);
  const [headingVisible, setHeadingVisible] = useState(false);
  const [revealDone, setRevealDone]         = useState(false);

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

      // Text blur-out on scroll
      const effectiveY = y <= SCROLL_DEAD_ZONE ? 0 : y - SCROLL_DEAD_ZONE;
      const blurProgress = Math.min(effectiveY / (SCROLL_BLUR_RANGE - SCROLL_DEAD_ZONE), 1);

      if (textBlurTopRef.current) {
        textBlurTopRef.current.style.filter = `blur(${blurProgress * 10}px)`;
        if (blurProgress > 0) textBlurTopRef.current.style.opacity = String(1 - blurProgress);
        else textBlurTopRef.current.style.removeProperty('opacity');
      }
      if (textBlurBottomRef.current) {
        textBlurBottomRef.current.style.filter = `blur(${blurProgress * 10}px)`;
        if (blurProgress > 0) textBlurBottomRef.current.style.opacity = String(1 - blurProgress);
        else textBlurBottomRef.current.style.removeProperty('opacity');
      }

      // Heading parallax fade-out
      if (headingWrapperRef.current) {
        const vh = window.innerHeight;
        const fadeStart = vh * 0.25;
        const fadeEnd = vh * 0.65;
        const headingProgress = Math.max(0, Math.min(1, (y - fadeStart) / (fadeEnd - fadeStart)));
        headingWrapperRef.current.style.opacity = String(1 - headingProgress);
        headingWrapperRef.current.style.transform = `translateY(${-40 * headingProgress}px)`;
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

  useEffect(() => {
    const showImage = (index: 0 | 1 | 2) => {
      const refs = [winterImg1Ref, winterImg2Ref, winterImg3Ref];
      refs.forEach((ref, i) => {
        if (ref.current) ref.current.style.opacity = i === index ? '1' : '0';
      });
    };

    const observe = (id: string, onEnter: () => void, onLeave: () => void) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => { entry.isIntersecting ? onEnter() : onLeave(); },
        { threshold: 0.15 }
      );
      obs.observe(el);
      return obs;
    };

    const obs1 = observe('about',       () => showImage(1), () => showImage(0));
    const obs2 = observe('who-are-you', () => showImage(2), () => showImage(1));

    return () => { obs1?.disconnect(); obs2?.disconnect(); };
  }, []);

  const scrollToServices = () => {
    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative h-full min-h-screen overflow-hidden bg-stone-50" aria-label="Hero">
      <h1 className="sr-only">{HEADING_LINE1} {HEADING_LINE2}</h1>

      {/* Right-side editorial images — crossfade on scroll, desktop only */}
      <div className="hidden md:block absolute right-0 top-0 h-full w-2/5 pointer-events-none">
        <img
          ref={winterImg1Ref}
          src="/images/styleforage-black-winter1.webp"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-top"
          style={{ opacity: 1, transition: 'opacity 0.8s ease' }}
        />
        <img
          ref={winterImg2Ref}
          src="/images/styleforage-black-winter2.webp"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-top"
          style={{ opacity: 0, transition: 'opacity 0.8s ease' }}
        />
        <img
          ref={winterImg3Ref}
          src="/images/styleforage-black-winter3.webp"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-top"
          style={{ opacity: 0, transition: 'opacity 0.8s ease' }}
        />
      </div>

      {/* Left column: container-aligned to match section headers */}
      <div className="container mx-auto px-4 h-full">
        <div className="flex flex-col justify-start md:justify-center h-auto md:h-screen gap-4 md:gap-10 md:self-center md:w-3/5">

          {/* Top editorial strip */}
          <div
            ref={textBlurTopRef}
            className={`hero-rest-in transition-none pt-24 md:pt-28 ${revealDone ? 'hero-rest-visible' : ''}`}
          >
            <div className="flex items-center gap-4">
              <span className="text-stone-500 font-sans text-xs uppercase tracking-[0.3em] shrink-0">
                Personal Styling &amp; Wardrobe
              </span>
              <div className="h-px w-8 bg-stone-400 shrink-0 hidden sm:inline" />
              <span className="text-stone-500 font-sans text-xs uppercase tracking-[0.3em] shrink-0 hidden sm:inline">
                Toronto, CA
              </span>
              <div className="h-px flex-1 bg-stone-400" />
            </div>
          </div>

          {/* Heading */}
          <div
            ref={headingWrapperRef}
            className="py-1"
          >
            <h2
              className={`hero-heading-in font-serif font-black text-stone-900 leading-[0.92] tracking-tight text-[clamp(1.9rem,8.8vw,3.1rem)] md:text-[clamp(3rem,5.5vw,6.5rem)] ${headingVisible ? 'is-visible' : ''}`}
              style={{ fontWeight: 900 }}
            >
              <span className="hero-reveal-line block whitespace-normal sm:whitespace-nowrap">
                {LINE1_WORDS.map((word, i) => (
                  <span
                    key={i}
                    className="hero-reveal-word"
                    style={{
                      animationDelay: `${REVEAL_START_DELAY + i * WORD_STAGGER}s`,
                      marginRight: i < LINE1_WORDS.length - 1 ? '0.28em' : undefined,
                    }}
                  >
                    {word}
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

          {/* Bottom editorial strip */}
          <div
            ref={textBlurBottomRef}
            className={`hero-rest-in transition-none pb-8 md:pb-12 ${revealDone ? 'hero-rest-visible' : ''}`}
          >
              <p className="text-stone-600 text-md max-w-lg font-sans font-light leading-relaxed">
                {HERO_SUBHEADING_WORDS.map((word, i) => (
                  <span key={i} className="inline-block" style={subheadingWordStyle(revealDone, i)}>
                    {word}{i < HERO_SUBHEADING_WORDS.length - 1 ? '\u00A0' : ''}
                  </span>
                ))}
              </p>
              <button
                onClick={scrollToServices}
                className="group inline-flex items-center gap-2 pt-8 text-stone-900 font-sans text-xs uppercase tracking-[0.2em] border-b border-stone-400 pb-0.5 hover:border-sage-500 hover:text-sage-600 transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>View Services</span>
                <span className="transition-transform duration-300 group-hover:translate-y-1" aria-hidden>↓</span>
              </button>
          </div>

          {/* Mobile image — stacked below text */}
          <div className="md:hidden w-full -mx-4" style={{ width: 'calc(100% + 2rem)' }}>
            <img
              src="/images/styleforage-black-winter2.webp"
              alt=""
              aria-hidden="true"
              className="w-full object-cover object-top"
            />
          </div>

        </div>
      </div>
    </section>
  );
};
