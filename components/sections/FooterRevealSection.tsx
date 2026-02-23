import React, { useRef, useEffect, useState } from 'react';

// ─── Copy (easy to modify) ─────────────────────────────────────────────────
const LINE1 = 'Book now and';
const LINE2 = 'step into your best self.';
const LINE1_CHARS = LINE1.split('');
const LINE2_CHARS = LINE2.split('');
const TOTAL_LETTERS = LINE1_CHARS.length + LINE2_CHARS.length;

// ─── Scroll-driven progress (0 → 1 as user scrolls further toward bottom) ───
/** Fraction of viewport height over which the full reveal runs; animation completes before footer. */
const REVEAL_VIEWPORT_FRACTION = 0.55;
/** Each letter fades in over this fraction of total progress. */
const FADE_RANGE = 0.08;

/**
 * Progress 0–1 from heading position so letters fade in as the user scrolls the
 * heading into view. 0 = heading not yet in view from bottom, 1 = heading has
 * scrolled up by REVEAL_VIEWPORT_FRACTION of viewport (animation completes before footer).
 */
function getScrollProgress(headingTop: number, vh: number): number {
  if (headingTop >= vh) return 0;
  const revealRange = vh * REVEAL_VIEWPORT_FRACTION;
  const scrolledInto = Math.max(0, vh - headingTop);
  return Math.min(1, scrolledInto / Math.max(revealRange, 1));
}

/**
 * Opacity 0–1 for one letter. Letters are spread across progress so the last
 * letter is fully visible when progress = 1.
 */
function letterOpacity(progress: number, letterIndex: number): number {
  if (TOTAL_LETTERS <= 1) return progress >= 1 ? 1 : 0;
  const threshold = (letterIndex / (TOTAL_LETTERS - 1)) * (1 - FADE_RANGE);
  const fadeEnd = threshold + FADE_RANGE;
  if (progress <= threshold) return 0;
  if (progress >= fadeEnd) return 1;
  return (progress - threshold) / FADE_RANGE;
}

export const FooterRevealSection: React.FC = () => {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = headingRef.current;
    if (!el) return;

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      setProgress(getScrollProgress(rect.top, vh));
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section
      id="footer-reveal"
      className="relative z-20 min-h-[80vh] flex flex-col items-start justify-center px-6 md:px-12 lg:px-20 py-12 bg-sand-50 border-t border-stone-100"
      aria-label="Book your consultation"
    >
      <h2
        ref={headingRef}
        className="relative font-serif text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-stone-900 tracking-tight leading-[1.1] whitespace-pre-wrap pb-3 pr-8 md:pr-16 text-left max-w-5xl overflow-visible"
        style={{ fontWeight: 700 }}
        aria-hidden="true"
      >
        <span className="hero-reveal-line bottom-reveal-line block">
          {LINE1_CHARS.map((char, i) => (
            <span
              key={`l1-${i}`}
              className={char === ' ' ? 'inline-block transition-opacity duration-150 w-[0.25em]' : 'inline-block transition-opacity duration-150'}
              style={{ opacity: letterOpacity(progress, i) }}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </span>
        <span className="hero-reveal-line bottom-reveal-line block">
          {LINE2_CHARS.slice(0, -5).map((char, i) => (
            <span
              key={`l2-${i}`}
              className={char === ' ' ? 'inline-block italic text-stone-700 transition-opacity duration-150 w-[0.25em]' : 'inline-block italic text-stone-700 transition-opacity duration-150'}
              style={{ opacity: letterOpacity(progress, LINE1_CHARS.length + i) }}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
          <span className="whitespace-nowrap inline">
            {LINE2_CHARS.slice(-5).map((char, i) => (
              <span
                key={`l2-tail-${i}`}
                className={char === ' ' ? 'inline-block italic text-stone-700 transition-opacity duration-150 w-[0.25em]' : 'inline-block italic text-stone-700 transition-opacity duration-150'}
                style={{ opacity: letterOpacity(progress, LINE1_CHARS.length + LINE2_CHARS.length - 5 + i) }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </span>
        </span>
      </h2>
    </section>
  );
};
