import React, { useRef, useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { FadeInOnScroll } from '../FadeInOnScroll';
import { EditorialSectionLabel } from '../EditorialSectionLabel';

// ─── Bio copy ───────────────────────────────────────────────────────────────
const P1_TEXT = "I've spent my career developing an eye for what works. As an editorial stylist at national magazines, a fashion writer for luxury publications, and a PR strategist for leading lifestyle brands, I learned to move through the industry with precision, identifying quality, spotting potential, and knowing when something is exactly right.";
const P2_TEXT = "With a graduate degree in art history, I bring a curator's sensibility to the personal work of building wardrobes that actually function. For real bodies, real schedules, and lives that refuse to sit still.";
const P3_TEXT = "I founded Style Forage to offer the kind of attentive, dedicated wardrobe and lifestyle partnership that's usually reserved for those with teams of people behind them. Made personal, considered, and accessible.";

const P1_WORDS = P1_TEXT.split(' ');
const P2_WORDS = P2_TEXT.split(' ');
const P3_WORDS = P3_TEXT.split(' ');

const WORD_STAGGER = 0.022; // seconds per word
const START_DELAY  = 0.25;
const P2_START     = START_DELAY + P1_WORDS.length * WORD_STAGGER + 0.1;
const P3_START     = P2_START + P2_WORDS.length * WORD_STAGGER + 0.1;
const LINK_DELAY   = P3_START + P3_WORDS.length * WORD_STAGGER - 0.15;

function wordStyle(inView: boolean, globalIndex: number, startDelay: number = START_DELAY) {
  const delay = startDelay + globalIndex * WORD_STAGGER;
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
            <EditorialSectionLabel number="01" label="Editor-in-Chief" className="mb-6 md:mb-8" />
            <h2 className="font-serif font-bold text-4xl md:text-5xl lg:text-6xl text-stone-900 leading-tight mb-6 md:mb-8" style={{ fontWeight: 700 }}>
              Roslyn Costanzo
            </h2>
            <div ref={bioRef} className="pl-4 md:pl-6 relative">
              {/* Left editorial rule */}
              <div className="absolute left-0 top-0 bottom-0 w-px bg-stone-200" />

              <div className="space-y-4 md:space-y-5 text-stone-600 text-sm md:text-base leading-relaxed font-light">

                {/* Para 1 */}
                <p>
                  {P1_WORDS.map((word, i) => (
                    <span key={i} className="inline-block" style={wordStyle(inView, i)}>
                      {word}{i < P1_WORDS.length - 1 ? '\u00A0' : ''}
                    </span>
                  ))}
                </p>

                {/* Para 2 */}
                <p>
                  {P2_WORDS.map((word, i) => (
                    <span key={i} className="inline-block" style={wordStyle(inView, i, P2_START)}>
                      {word}{i < P2_WORDS.length - 1 ? '\u00A0' : ''}
                    </span>
                  ))}
                </p>

                {/* Para 3 */}
                <p>
                  {P3_WORDS.map((word, i) => (
                    <span key={i} className="inline-block" style={wordStyle(inView, i, P3_START)}>
                      {word}{i < P3_WORDS.length - 1 ? '\u00A0' : ''}
                    </span>
                  ))}
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

            {/* Who are you? */}
            <div id="who-are-you" className="mt-16 md:mt-20">
              <EditorialSectionLabel number="02" label="Who are you?" className="mb-6 md:mb-8" />
              <h2 className="font-serif font-bold text-4xl md:text-5xl lg:text-6xl text-stone-900 leading-tight mb-6 md:mb-8" style={{ fontWeight: 700 }}>Your life is full by design.</h2>
              <div className="pl-4 md:pl-6 relative">
                <div className="absolute left-0 top-0 bottom-0 w-px bg-stone-200" />
                <div className="space-y-4 text-stone-600 text-sm md:text-base leading-relaxed font-light">
                  <p><span className="text-stone-900 font-medium">Catch up.</span> Somewhere between the promotion, the move, the kids, the new chapter, your wardrobe fell behind. Half of it belongs to a version of you that no longer exists. You know it. You just haven't had a free Saturday to deal with it.</p>
                  <p><span className="text-stone-900 font-medium">Keep up.</span> Even when you find something that works, life moves again. A new season, a body change, a different kind of event on the calendar. What worked in March doesn't work in September. Staying current takes more attention than you have to give.</p>
                  <p><span className="text-stone-900 font-medium">Dress for the moment.</span> Then come the moments that matter. The presentation. The gala. The family photo. The trip. And instead of feeling ready, you're scrambling, settling, or showing up in something that's fine but not right.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </FadeInOnScroll>
    </section>
  );
};
