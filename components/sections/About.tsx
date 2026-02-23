import React, { useRef, useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { FadeInOnScroll } from '../FadeInOnScroll';
import { EditorialSectionLabel } from '../EditorialSectionLabel';

// ─── Bio copy (split around inline link in P1) ──────────────────────────────
const P1_PRE  = "I've been obsessed with fashion since my first paycheque in 1992 — which I promptly spent at Smart Set. Since then, I've built a career around style: serving as a style editor at two national lifestyle magazines, contributing to";
const P1_POST = "and working one-on-one as a wardrobe consultant to help people define and refine their personal style with confidence.";
const P2_TEXT = "Because the truth is, when you look good, you feel good and people around you notice.";
const P3_TEXT = "So if you need a boost and are tired of feeling frustrated every time you get dressed for the day, let's chat!";

const P1_PRE_WORDS  = P1_PRE.split(' ');
const P1_POST_WORDS = P1_POST.split(' ');
const P2_WORDS      = P2_TEXT.split(' ');
const P3_WORDS      = P3_TEXT.split(' ');

// P1 total tokens: pre-words + 1 link token + post-words
const P1_TOKEN_COUNT = P1_PRE_WORDS.length + 1 + P1_POST_WORDS.length;

const WORD_STAGGER  = 0.022; // seconds per word
const START_DELAY   = 0.25;
const P2_START      = START_DELAY + P1_TOKEN_COUNT * WORD_STAGGER + 0.1;
const P3_START      = P2_START + P2_WORDS.length * WORD_STAGGER + 0.1;
const LINK_DELAY    = P3_START + P3_WORDS.length * WORD_STAGGER - 0.15;

function wordStyle(inView: boolean, globalIndex: number) {
  const delay = START_DELAY + globalIndex * WORD_STAGGER;
  return {
    opacity: inView ? 1 : 0,
    transform: inView ? 'none' : 'translateY(5px)',
    transition: inView
      ? `opacity 0.4s ease ${delay}s, transform 0.4s ease ${delay}s`
      : 'none',
  } as React.CSSProperties;
}

export const About: React.FC = () => {
  const bioRef      = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = bioRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const linkHideStyle: React.CSSProperties = {
    opacity: inView ? 0 : 1,
    transition: inView ? `opacity 0.7s ease ${LINK_DELAY}s` : 'none',
  };
  const linkShowStyle: React.CSSProperties = {
    opacity: inView ? 1 : 0,
    transition: inView ? `opacity 0.7s ease ${LINK_DELAY}s` : 'none',
  };

  return (
    <section id="about" className="py-16 md:py-24 bg-stone-50 md:bg-transparent relative overflow-x-hidden">
      <FadeInOnScroll>
        <div className="container mx-auto px-4">
          <div className="max-w-xl">
            <EditorialSectionLabel number="01" label="About the Stylist" className="mb-6 md:mb-8" />
            <h2 className="font-serif font-bold text-4xl md:text-5xl lg:text-6xl text-stone-900 leading-tight mb-6 md:mb-8" style={{ fontWeight: 700 }}>
              Roslyn Costanzo
            </h2>
            <div ref={bioRef} className="pl-4 md:pl-6 relative">
              {/* Left editorial rule */}
              <div className="absolute left-0 top-0 bottom-0 w-px bg-stone-200" />

              <div className="space-y-4 md:space-y-5 text-stone-600 text-sm md:text-base leading-relaxed font-light">

                {/* Para 1 — word-level with inline Globe & Mail link */}
                <p>
                  {P1_PRE_WORDS.map((word, i) => (
                    <span key={i} className="inline-block" style={wordStyle(inView, i)}>
                      {word}{'\u00A0'}
                    </span>
                  ))}
                  <span className="inline-block" style={wordStyle(inView, P1_PRE_WORDS.length)}>
                    <a
                      href="https://www.theglobeandmail.com/business/article-why-empathy-and-adaptability-are-the-new-pillars-of-leadership/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sage-500 italic hover:text-sage-700 transition-colors underline underline-offset-2"
                    >The Globe &amp; Mail</a>,{'\u00A0'}
                  </span>
                  {P1_POST_WORDS.map((word, i) => (
                    <span key={i} className="inline-block" style={wordStyle(inView, P1_PRE_WORDS.length + 1 + i)}>
                      {word}{i < P1_POST_WORDS.length - 1 ? '\u00A0' : ''}
                    </span>
                  ))}
                </p>

                {/* Para 2 */}
                <p>
                  {P2_WORDS.map((word, i) => {
                    const delay = P2_START + i * WORD_STAGGER;
                    return (
                      <span
                        key={i}
                        className="inline-block"
                        style={{
                          opacity: inView ? 1 : 0,
                          transform: inView ? 'none' : 'translateY(5px)',
                          transition: inView
                            ? `opacity 0.4s ease ${delay}s, transform 0.4s ease ${delay}s`
                            : 'none',
                        }}
                      >
                        {word}{i < P2_WORDS.length - 1 ? '\u00A0' : ''}
                      </span>
                    );
                  })}
                </p>

                {/* Para 3 */}
                <p>
                  {P3_WORDS.map((word, i) => {
                    const delay = P3_START + i * WORD_STAGGER;
                    return (
                      <span
                        key={i}
                        className="inline-block"
                        style={{
                          opacity: inView ? 1 : 0,
                          transform: inView ? 'none' : 'translateY(5px)',
                          transition: inView
                            ? `opacity 0.4s ease ${delay}s, transform 0.4s ease ${delay}s`
                            : 'none',
                        }}
                      >
                        {word}{i < P3_WORDS.length - 1 ? '\u00A0' : ''}
                      </span>
                    );
                  })}
                </p>
              </div>

              {/* Instagram link */}
              <div className="mt-6 md:mt-8">
                <a
                  href="https://www.instagram.com/styleforage/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center justify-start py-2 font-medium"
                >
                  <span className="relative">
                    <span className="text-stone-700" style={linkHideStyle}>
                      Follow @styleforage on Instagram
                    </span>
                    <span
                      className="absolute inset-0 bg-clip-text text-transparent whitespace-nowrap"
                      style={{
                        backgroundImage: 'linear-gradient(to right, #FFDC80, #F77737, #E1306C, #C13584, #833AB4)',
                        ...linkShowStyle,
                      }}
                    >
                      Follow @styleforage on Instagram
                    </span>
                  </span>
                  <span className="relative ml-2 w-4 h-4 flex-shrink-0 transition-transform duration-300 group-hover:translate-x-1">
                    <ArrowRight size={16} className="absolute inset-0 text-stone-700" style={linkHideStyle} />
                    <svg
                      className="absolute inset-0 w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="url(#ig-grad)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={linkShowStyle}
                    >
                      <defs>
                        <linearGradient id="ig-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%"   stopColor="#FFDC80" />
                          <stop offset="25%"  stopColor="#F77737" />
                          <stop offset="50%"  stopColor="#E1306C" />
                          <stop offset="75%"  stopColor="#C13584" />
                          <stop offset="100%" stopColor="#833AB4" />
                        </linearGradient>
                      </defs>
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </FadeInOnScroll>
    </section>
  );
};
