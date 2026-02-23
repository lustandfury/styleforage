import React, { useRef, useEffect } from 'react';
import { FadeInOnScroll } from '../FadeInOnScroll';
import { ChevronDown } from 'lucide-react';
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
  const pinkColor = '#ec4899';
  const sageColor = '#5a7a5a';

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
    <section className="py-16 md:py-24 bg-white border-b border-stone-100">
      <FadeInOnScroll>
      <div className="container mx-auto px-4">
        {/* Editorial section header */}
        <div className="flex items-center gap-3 mb-8 md:mb-12">
          <span className="font-sans text-xs text-stone-400 uppercase tracking-[0.3em]">02</span>
          <div className="h-px w-8 bg-stone-300" />
          <span className="font-sans text-xs text-stone-400 uppercase tracking-[0.3em]">The Process</span>
        </div>
        <div className="md:flex md:items-end md:justify-between mb-10 md:mb-16">
          <h2 className="font-serif font-bold text-3xl md:text-5xl text-stone-900 max-w-sm" style={{ fontWeight: 700 }}>A Thoughtful Approach</h2>
          <p className="max-w-sm text-stone-500 leading-relaxed text-sm md:text-base mt-4 md:mt-0">
            Most clients begin with a closet edit, so we can shop intentionally and build a wardrobe that feels cohesive, wearable, and truly theirs.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
          <FadeInOnScroll delay={100}>
            <div
              className="group p-6 md:p-8 bg-sand-50 border border-stone-100 hover:border-stone-300 transition-all text-left cursor-pointer hover:shadow-md"
              onClick={() => scrollToService('closet-reset')}
              onMouseEnter={() => handleIconHover(icon1Ref.current, true)}
              onMouseLeave={() => handleIconHover(icon1Ref.current, false)}
            >
              <div className="flex items-start justify-between mb-6">
                <div
                  ref={icon1Ref}
                  className="w-10 h-10 flex items-center justify-center border border-stone-200 group-hover:border-sage-300 transition-colors"
                >
                  <ClosetOpen className="w-5 h-5 text-sage-600" strokeWidth={1.5} />
                </div>
                <span className="font-sans text-xs text-stone-300 tracking-[0.3em]">01</span>
              </div>
              <h3 className="font-serif font-bold text-xl md:text-2xl mb-3 text-stone-900" style={{ fontWeight: 700 }}>The Closet Edit</h3>
              <p className="text-stone-500 text-sm md:text-base leading-relaxed">A strategic in-home edit to help you see what you own differently — and build real outfits from it.</p>
              <div className="mt-5 pt-4 border-t border-stone-100 group-hover:border-stone-200 transition-colors flex items-center gap-1 text-stone-400 text-xs uppercase tracking-[0.15em] font-sans">
                <span>View more</span>
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </div>
            </div>
          </FadeInOnScroll>
          <FadeInOnScroll delay={250}>
            <div
              className="group p-6 md:p-8 bg-sand-50 border border-stone-100 hover:border-stone-300 transition-all text-left cursor-pointer hover:shadow-md"
              onClick={() => scrollToService('style-upgrade')}
              onMouseEnter={() => handleIconHover(icon2Ref.current, true)}
              onMouseLeave={() => handleIconHover(icon2Ref.current, false)}
            >
              <div className="flex items-start justify-between mb-6">
                <div
                  ref={icon2Ref}
                  className="w-10 h-10 flex items-center justify-center border border-stone-200 group-hover:border-sage-300 transition-colors"
                >
                  <Restart className="w-5 h-5 text-sage-600" strokeWidth={1.5} />
                </div>
                <span className="font-sans text-xs text-stone-300 tracking-[0.3em]">02</span>
              </div>
              <h3 className="font-serif font-bold text-xl md:text-2xl mb-3 text-stone-900" style={{ fontWeight: 700 }}>The Style Upgrade</h3>
              <p className="text-stone-500 text-sm md:text-base leading-relaxed">Closet Edit plus shopping — so you don't just know what's missing, it gets handled.</p>
              <div className="mt-5 pt-4 border-t border-stone-100 group-hover:border-stone-200 transition-colors flex items-center gap-1 text-stone-400 text-xs uppercase tracking-[0.15em] font-sans">
                <span>View more</span>
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </div>
            </div>
          </FadeInOnScroll>
          <FadeInOnScroll delay={400}>
            <div
              className="group p-6 md:p-8 bg-sand-50 border border-stone-100 hover:border-stone-300 transition-all text-left cursor-pointer hover:shadow-md"
              onClick={() => scrollToService('style-refresh')}
              onMouseEnter={() => handleIconHover(icon3Ref.current, true)}
              onMouseLeave={() => handleIconHover(icon3Ref.current, false)}
            >
              <div className="flex items-start justify-between mb-6">
                <div
                  ref={icon3Ref}
                  className="w-10 h-10 flex items-center justify-center border border-stone-200 group-hover:border-sage-300 transition-colors"
                >
                  <MagicWand className="w-5 h-5 text-sage-600" strokeWidth={1.5} />
                </div>
                <span className="font-sans text-xs text-stone-300 tracking-[0.3em]">03</span>
              </div>
              <h3 className="font-serif font-bold text-xl md:text-2xl mb-3 text-stone-900" style={{ fontWeight: 700 }}>The Style Refresh</h3>
              <p className="text-stone-500 text-sm md:text-base leading-relaxed">For travel, events, or seasonal updates. No Closet Edit required.</p>
              <div className="mt-5 pt-4 border-t border-stone-100 group-hover:border-stone-200 transition-colors flex items-center gap-1 text-stone-400 text-xs uppercase tracking-[0.15em] font-sans">
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
