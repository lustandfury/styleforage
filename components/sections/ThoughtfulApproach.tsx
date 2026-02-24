import React, { useRef, useEffect } from 'react';
import { FadeInOnScroll } from '../FadeInOnScroll';
import { EditorialSectionLabel } from '../EditorialSectionLabel';
import { Restart, MagicWand } from 'iconoir-react';
import gsap from 'gsap';

// Custom Closet Open icon - based on Iconoir Closet with right door wide open
const ClosetOpen: React.FC<{ className?: string; strokeWidth?: number }> = ({ 
  className = '', 
  strokeWidth = 1.5 
}) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    strokeWidth={strokeWidth}
    stroke="currentColor"
  >
    {/* Closet frame/back */}
    <path d="M5 2H19V22H5V2Z" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Center divider / shelf hint */}
    <path d="M12 2V22" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Left door (closed) */}
    <path d="M5 2H12V22H5V2Z" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Left door handle */}
    <path d="M10 11V13" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Right door wide open - perspective view */}
    <path d="M19 2L23 4V20L19 22" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Door handle on open door */}
    <path d="M21.5 11.5V12.5" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Clothes/hangers visible inside */}
    <path d="M14 6V8" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
    <path d="M16 6V9" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
  </svg>
);

export const ThoughtfulApproach: React.FC = () => {
  const scrollToService = (serviceId: string) => {
    const element = document.getElementById(`service-${serviceId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const icon1Ref = useRef<HTMLDivElement>(null);
  const icon2Ref = useRef<HTMLDivElement>(null);
  const icon3Ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  // Pink color for hover animation
  const pinkColor = '#FDD245';
  const sageColor = '#a8c5a8';

  const animateIconDraw = (iconContainer: HTMLDivElement, delay: number) => {
    const paths = iconContainer.querySelectorAll('path, line, circle, polyline, polygon, rect');
    
    paths.forEach((path) => {
      const element = path as SVGGeometryElement;
      if (element.getTotalLength) {
        const length = element.getTotalLength();
        gsap.set(element, {
          strokeDasharray: length,
          strokeDashoffset: length,
        });
        
        gsap.to(element, {
          strokeDashoffset: 0,
          duration: 1.2,
          delay: delay,
          ease: 'power2.out',
        });
      }
    });
  };

  const handleIconHover = (iconContainer: HTMLDivElement | null, isEntering: boolean) => {
    if (!iconContainer) return;
    
    const paths = iconContainer.querySelectorAll('path, line, circle, polyline, polygon, rect');
    
    paths.forEach((path) => {
      const element = path as SVGGeometryElement;
      if (element.getTotalLength) {
        const length = element.getTotalLength();
        
        if (isEntering) {
          // On hover: draw with pink
          gsap.set(element, {
            stroke: pinkColor,
            strokeDasharray: length,
            strokeDashoffset: length,
          });
          
          gsap.to(element, {
            strokeDashoffset: 0,
            duration: 0.6,
            ease: 'power2.out',
          });
        } else {
          // On leave: animate back to sage
          gsap.set(element, {
            stroke: sageColor,
            strokeDasharray: length,
            strokeDashoffset: length,
          });
          
          gsap.to(element, {
            strokeDashoffset: 0,
            duration: 0.6,
            ease: 'power2.out',
          });
        }
      }
    });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            
            // Wait for fade-in to complete before drawing icons
            // FadeInOnScroll delays (100ms, 250ms, 400ms) + CSS delay (500ms) + CSS duration (500ms)
            if (icon1Ref.current) animateIconDraw(icon1Ref.current, 1.1);  // 100ms + 1000ms
            if (icon2Ref.current) animateIconDraw(icon2Ref.current, 1.25); // 250ms + 1000ms
            if (icon3Ref.current) animateIconDraw(icon3Ref.current, 1.4);  // 400ms + 1000ms
          }
        });
      },
      { threshold: 0.3 }
    );

    if (icon1Ref.current) observer.observe(icon1Ref.current);

    return () => observer.disconnect();
  }, []);

  return (
    <section data-nav-theme="dark" className="py-16 md:py-24 mobile-menu-leather border-b border-sage-800">
      <FadeInOnScroll>
      <div className="container mx-auto px-4">
        {/* Header — inlined to place illustration beside description */}
        <div className="mb-10 md:mb-16">
          <EditorialSectionLabel number="02" label="The Process" dark className="mb-8 md:mb-12" />
          <div className="md:flex md:items-end gap-4">
            <h2
              className="font-serif font-bold text-3xl md:text-5xl max-w-sm text-white"
              style={{ fontWeight: 700 }}
            >
              A Thoughtful Approach
            </h2>
            <div className="flex items-end gap-4 mt-4 md:mt-0">
              <p className="max-w-sm leading-relaxed text-sm md:text-base text-sage-300">
                Most clients begin with a closet edit, so we can shop intentionally and build a wardrobe that feels cohesive, wearable, and truly theirs.
              </p>
              <img
                src="/images/illustrations/pick-the-ripe-apple.svg"
                alt=""
                aria-hidden="true"
                className="flex-shrink-0 w-12 md:w-14 h-auto opacity-90"
              />
            </div>
          </div>
        </div>

        {/* Cards — full width */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          <FadeInOnScroll delay={100}>
            <div
              className="group p-6 md:p-8 rounded-sm bg-[#1e3a2d] border border-sage-700 hover:border-sage-500 transition-all text-left cursor-pointer hover:shadow-lg hover:shadow-black/20"
              onClick={() => scrollToService('style-upgrade')}
              onMouseEnter={() => handleIconHover(icon1Ref.current, true)}
              onMouseLeave={() => handleIconHover(icon1Ref.current, false)}
            >
              <div className="flex items-start justify-between mb-6">
                <div
                  ref={icon1Ref}
                  className="w-10 h-10 flex items-center justify-center border border-sage-600 group-hover:border-sage-400 transition-colors"
                >
                  <MagicWand className="w-5 h-5 text-sage-300" strokeWidth={1.5} />
                </div>
                <span className="font-sans text-xs text-[#FDD245] tracking-[0.3em]">01</span>
              </div>
              <h3 className="font-serif font-bold text-xl md:text-2xl mb-3 text-white" style={{ fontWeight: 700 }}>The Style Upgrade</h3>
              <p className="text-sage-300 text-sm md:text-base leading-relaxed">Closet Edit plus shopping — so you don't just know what's missing, it gets handled.</p>
              <div className="mt-5 pt-4 border-t border-sage-700 group-hover:border-sage-500 transition-colors flex items-center gap-1 text-sage-400 text-xs uppercase tracking-[0.15em] font-sans">
                <span>View more</span>
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </div>
            </div>
          </FadeInOnScroll>
          <FadeInOnScroll delay={250}>
            <div
              className="group p-6 md:p-8 rounded-sm bg-[#1e3a2d] border border-sage-700 hover:border-sage-500 transition-all text-left cursor-pointer hover:shadow-lg hover:shadow-black/20"
              onClick={() => scrollToService('closet-reset')}
              onMouseEnter={() => handleIconHover(icon2Ref.current, true)}
              onMouseLeave={() => handleIconHover(icon2Ref.current, false)}
            >
              <div className="flex items-start justify-between mb-6">
                <div
                  ref={icon2Ref}
                  className="w-10 h-10 flex items-center justify-center border border-sage-600 group-hover:border-sage-400 transition-colors"
                >
                  <ClosetOpen className="w-5 h-5 text-sage-300" strokeWidth={1.5} />
                </div>
                <span className="font-sans text-xs text-[#FDD245] tracking-[0.3em]">02</span>
              </div>
              <h3 className="font-serif font-bold text-xl md:text-2xl mb-3 text-white" style={{ fontWeight: 700 }}>The Closet Edit</h3>
              <p className="text-sage-300 text-sm md:text-base leading-relaxed">A strategic in-home edit to help you see what you own differently — and build real outfits from it.</p>
              <div className="mt-5 pt-4 border-t border-sage-700 group-hover:border-sage-500 transition-colors flex items-center gap-1 text-sage-400 text-xs uppercase tracking-[0.15em] font-sans">
                <span>View more</span>
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </div>
            </div>
          </FadeInOnScroll>
          <FadeInOnScroll delay={400}>
            <div
              className="group p-6 md:p-8 rounded-sm bg-[#1e3a2d] border border-sage-700 hover:border-sage-500 transition-all text-left cursor-pointer hover:shadow-lg hover:shadow-black/20"
              onClick={() => scrollToService('style-refresh')}
              onMouseEnter={() => handleIconHover(icon3Ref.current, true)}
              onMouseLeave={() => handleIconHover(icon3Ref.current, false)}
            >
              <div className="flex items-start justify-between mb-6">
                <div
                  ref={icon3Ref}
                  className="w-10 h-10 flex items-center justify-center border border-sage-600 group-hover:border-sage-400 transition-colors"
                >
                  <Restart className="w-5 h-5 text-sage-300" strokeWidth={1.5} />
                </div>
                <span className="font-sans text-xs text-[#FDD245] tracking-[0.3em]">03</span>
              </div>
              <h3 className="font-serif font-bold text-xl md:text-2xl mb-3 text-white" style={{ fontWeight: 700 }}>The Style Refresh</h3>
              <p className="text-sage-300 text-sm md:text-base leading-relaxed">For travel, events, or seasonal updates. No Closet Edit required.</p>
              <div className="mt-5 pt-4 border-t border-sage-700 group-hover:border-sage-500 transition-colors flex items-center gap-1 text-sage-400 text-xs uppercase tracking-[0.15em] font-sans">
                <span>View more</span>
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </div>
            </div>
          </FadeInOnScroll>
        </div>
      </div>
      </FadeInOnScroll>
    </section>
  );
};
