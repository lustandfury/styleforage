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
            
            // Draw icons as soon as the section is in view
            if (icon1Ref.current) animateIconDraw(icon1Ref.current, 0);
            if (icon2Ref.current) animateIconDraw(icon2Ref.current, 0);
            if (icon3Ref.current) animateIconDraw(icon3Ref.current, 0);
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
      <div className="container mx-auto px-4 text-center">
        <h2 className="font-serif text-3xl md:text-5xl text-stone-900 mb-4 md:mb-6">A Thoughtful Approach</h2>
        <img
          src="/images/roz.png"
          alt="Roslyn Costanzo, Personal Stylist"
          className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover mx-auto mb-6 md:mb-8 border-2 border-stone-100 shadow-lg"
        />
        <p className="max-w-2xl mx-auto text-stone-600 mb-8 md:mb-12 leading-relaxed text-base md:text-lg px-0">
          I take a thoughtful, step-by-step approach. Most clients begin with a closet edit,
          so we can shop intentionally and build a wardrobe that feels cohesive, wearable, and truly theirs.
        </p>
        <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto mt-8 md:mt-12">
          <FadeInOnScroll>
            <div 
              className="group p-6 md:p-10 bg-stone-50 rounded-2xl transition-all text-left cursor-pointer hover:shadow-lg"
              onClick={() => scrollToService('closet-edit')}
              onMouseEnter={() => handleIconHover(icon1Ref.current, true)}
              onMouseLeave={() => handleIconHover(icon1Ref.current, false)}
            >
              <div 
                ref={icon1Ref}
                className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-sage-100 flex items-center justify-center mb-4 md:mb-5"
              >
                <ClosetOpen className="w-6 h-6 md:w-7 md:h-7 text-sage-600" strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-xl md:text-2xl mb-3 md:mb-4 text-stone-800">The Closet Edit</h3>
              <p className="text-stone-500 text-sm md:text-base leading-relaxed">A fresh perspective focused on fit, comfort, and relevance to your life today.</p>
              <div className="mt-4 flex items-center gap-1 text-stone-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span>View more</span>
                <ChevronDown size={16} className="transition-transform duration-300 group-hover:translate-y-0.5" />
              </div>
            </div>
          </FadeInOnScroll>
          <FadeInOnScroll>
            <div 
              className="group p-6 md:p-10 bg-stone-50 rounded-2xl transition-all text-left cursor-pointer hover:shadow-lg"
              onClick={() => scrollToService('full-style-reset')}
              onMouseEnter={() => handleIconHover(icon2Ref.current, true)}
              onMouseLeave={() => handleIconHover(icon2Ref.current, false)}
            >
              <div 
                ref={icon2Ref}
                className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-sage-100 flex items-center justify-center mb-4 md:mb-5"
              >
                <Restart className="w-6 h-6 md:w-7 md:h-7 text-sage-600" strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-xl md:text-2xl mb-3 md:mb-4 text-stone-800">Full Style Reset</h3>
              <p className="text-stone-500 text-sm md:text-base leading-relaxed">For clients ready for a meaningful refresh and a wardrobe that feels aligned.</p>
              <div className="mt-4 flex items-center gap-1 text-stone-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span>View more</span>
                <ChevronDown size={16} className="transition-transform duration-300 group-hover:translate-y-0.5" />
              </div>
            </div>
          </FadeInOnScroll>
          <FadeInOnScroll>
            <div 
              className="group p-6 md:p-10 bg-stone-50 rounded-2xl transition-all text-left cursor-pointer hover:shadow-lg"
              onClick={() => scrollToService('style-refresh')}
              onMouseEnter={() => handleIconHover(icon3Ref.current, true)}
              onMouseLeave={() => handleIconHover(icon3Ref.current, false)}
            >
              <div 
                ref={icon3Ref}
                className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-sage-100 flex items-center justify-center mb-4 md:mb-5"
              >
                <MagicWand className="w-6 h-6 md:w-7 md:h-7 text-sage-600" strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-xl md:text-2xl mb-3 md:mb-4 text-stone-800">Style Refresh</h3>
              <p className="text-stone-500 text-sm md:text-base leading-relaxed">A focused update for a season, event, trip, or specific life change.</p>
              <div className="mt-4 flex items-center gap-1 text-stone-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span>View more</span>
                <ChevronDown size={16} className="transition-transform duration-300 group-hover:translate-y-0.5" />
              </div>
            </div>
          </FadeInOnScroll>
        </div>
      </div>
      </FadeInOnScroll>
    </section>
  );
};
