import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { FadeInOnScroll } from '../FadeInOnScroll';
import { EditorialSectionLabel } from '../EditorialSectionLabel';

export const ThoughtfulApproach: React.FC = () => {
  const card1Ref     = useRef<HTMLDivElement>(null);
  const card2Ref     = useRef<HTMLDivElement>(null);
  const card3Ref     = useRef<HTMLDivElement>(null);
  const gridRef      = useRef<HTMLDivElement>(null);
  const hasAnimated  = useRef(false);

  useEffect(() => {
    const cards = [card1Ref.current, card2Ref.current, card3Ref.current].filter(Boolean);

    // Start cards invisible and rotated — prevents flash before animation
    gsap.set(cards, { rotateY: -90, opacity: 0, transformOrigin: 'left center' });

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          observer.disconnect();
          gsap.to(cards, {
            rotateY: 0,
            opacity: 1,
            duration: 0.65,
            stagger: 0.18,
            ease: 'power3.out',
          });
        }
      },
      { threshold: 0.2 }
    );

    if (gridRef.current) observer.observe(gridRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section data-nav-theme="dark" className="py-16 md:py-24 mobile-menu-leather border-b border-sage-800">
      <FadeInOnScroll>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-10 md:mb-16 flex items-center gap-8">
          <div>
            <EditorialSectionLabel number="03" label="The Process" dark className="mb-8 md:mb-12" />
            <h2
              className="font-serif font-bold text-3xl md:text-5xl max-w-sm text-white"
              style={{ fontWeight: 700 }}
            >
              A Thoughtful Approach
            </h2>
            <p className="mt-4 text-sage-300 text-sm md:text-base leading-relaxed font-light max-w-sm">
              Foraging works in three deliberate steps. Each one naturally builds on the last – so nothing is wasted.
            </p>
          </div>
          <img
            src="/images/illustrations/pick-the-ripe-apple.svg"
            alt=""
            aria-hidden="true"
            className="hidden md:block flex-shrink-0 w-32 h-auto opacity-90"
          />
        </div>

        {/* Cards — sequential flip-in via GSAP */}
        <div ref={gridRef} className="grid md:grid-cols-3 gap-6 md:gap-8 items-stretch" style={{ perspective: '1200px' }}>
          <div ref={card1Ref} className="h-full p-6 md:p-8 rounded-sm bg-[#122318] leather-texture border border-sage-700">
            <div className="flex items-baseline justify-between mb-4">
              <h3 className="font-serif font-bold text-xl md:text-2xl text-white" style={{ fontWeight: 700 }}>Gather</h3>
              <span className="font-sans text-sm text-[#FDD245] tracking-[0.3em] shrink-0">01</span>
            </div>
            <p className="text-sage-300 text-sm md:text-base leading-relaxed">Before we add anything, we make sense of what you have. A comprehensive wardrobe audit to identify what's working, what's not, what just needs a small alteration to become essential, and where the real gaps are. We separate the signal from the noise, then build a clear, strategic plan to move forward. No excess. Just clarity.</p>
          </div>
          <div ref={card2Ref} className="h-full p-6 md:p-8 rounded-sm bg-[#122318] leather-texture border border-sage-700">
            <div className="flex items-baseline justify-between mb-4">
              <h3 className="font-serif font-bold text-xl md:text-2xl text-white" style={{ fontWeight: 700 }}>Explore</h3>
              <span className="font-sans text-sm text-[#FDD245] tracking-[0.3em] shrink-0">02</span>
            </div>
            <p className="text-sage-300 text-sm md:text-base leading-relaxed">We start by understanding your world. Not just your measurements or Pinterest board, but the full picture: your goals, your calendar, the roles you play, and the life you're building. What do you need to show up for next month? Next year? What's shifting? This conversation is the foundation everything else is built on.</p>
          </div>
          <div ref={card3Ref} className="h-full p-6 md:p-8 rounded-sm bg-[#122318] leather-texture border border-sage-700">
            <div className="flex items-baseline justify-between mb-4">
              <h3 className="font-serif font-bold text-xl md:text-2xl text-white" style={{ fontWeight: 700 }}>Collect</h3>
              <span className="font-sans text-sm text-[#FDD245] tracking-[0.3em] shrink-0">03</span>
            </div>
            <p className="text-sage-300 text-sm md:text-base leading-relaxed">This is where the partnership comes alive. As your life shifts, your wardrobe evolves with you. New role, new city, body changes, a gala on Friday? We're already sourcing, already thinking ahead. Seasonal refreshes. Event-ready at a moment's notice. A text away whenever you need us. Your wardrobe grows as you do: considered, quietly right.</p>
          </div>
        </div>
      </div>
      </FadeInOnScroll>
    </section>
  );
};
