import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Quote, ChevronLeft, ChevronRight } from 'lucide-react';

const originalTestimonials = [
  {
    id: 1,
    name: "Christine Kwok",
    role: "Wardrobe Edit",
    text: "Working with Roslyn was lovely. Online, she knew exactly what I wanted and sent me a few suggestions. In person, it was like chatting with a girlfriend and she was able to find me pieces that go together nicely as well as work with my existing wardrobe. As a mom herself, Roslyn understands the types of clothes moms need to be in, but she's able to find pieces that are stylish.",
  },
  {
    id: 2,
    name: "Ellen Bayley",
    role: "Full Consultation",
    text: "I loved working with Roz because she knows fashion and she knew the right fashion for me. She thrives on helping people look and feel good. Her sweet personality and non-judgemental approach made the wardrobe consultation and in-store shop a delightful experience! My family says I’ve never looked so beautiful and confident.",
  },
  {
    id: 3,
    name: "Kirsten Almon",
    role: "Virtual Styling",
    text: "Just had a chance to look at everything and you've totally nailed it! Thank you for all of the info and suggestions – I love that you also noted what would be best buys to begin with. I want it all!!",
  },
  {
    id: 4,
    name: "Lisa Ketchmark",
    role: "Personal Shopping",
    text: "I had a great experience shopping with Roz. She was very organized with outfits picked out in multiple stores. She helped me expand my wardrobe, within my budget, and made the experience fun. It was so worth the investment and my closet thanks her.",
  },
  {
    id: 5,
    name: "Amanda Magee",
    role: "Corporate Style Talk",
    text: "Roslyn came and talked to my team about their professional image and they were very receptive. I have noticed that they have uplevelled their style in the days since her visit. Roslyn is professional, engaging, and truly knows how to connect with a brand's vision.",
  }
];

// To create an infinite loop effect, we clone the last item to the front and the first item to the back
const testimonials = [
  originalTestimonials[originalTestimonials.length - 1],
  ...originalTestimonials,
  originalTestimonials[0]
];

export const Testimonials: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollTimer = useRef<number | null>(null);
  const [realIndex, setRealIndex] = useState(0); 
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isUserInteracting, setIsUserInteracting] = useState(false);

  // Initial scroll position to the first "real" testimonial
  useEffect(() => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.offsetWidth;
      scrollRef.current.scrollLeft = cardWidth;
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current || isTransitioning) return;

    const scrollLeft = scrollRef.current.scrollLeft;
    const cardWidth = scrollRef.current.offsetWidth;
    const scrollIndex = Math.round(scrollLeft / cardWidth);

    // Calculate real index for dots
    let displayIndex = scrollIndex - 1;
    if (displayIndex < 0) displayIndex = originalTestimonials.length - 1;
    if (displayIndex >= originalTestimonials.length) displayIndex = 0;
    
    setRealIndex(displayIndex);

    // Handle Infinite Jump Logic
    if (scrollLeft >= (testimonials.length - 1) * cardWidth) {
      scrollRef.current.scrollLeft = cardWidth;
    }
    if (scrollLeft <= 0) {
      scrollRef.current.scrollLeft = (testimonials.length - 2) * cardWidth;
    }
  }, [isTransitioning]);

  const scrollTo = useCallback((index: number, smooth = true) => {
    if (scrollRef.current) {
      setIsTransitioning(true);
      const cardWidth = scrollRef.current.offsetWidth;
      scrollRef.current.scrollTo({
        left: cardWidth * (index + 1),
        behavior: smooth ? 'smooth' : 'auto'
      });
      setTimeout(() => setIsTransitioning(false), 500);
    }
  }, []);

  const scrollPrev = () => {
    if (isTransitioning) return;
    scrollTo(realIndex - 1);
  };

  const scrollNext = useCallback(() => {
    if (isTransitioning) return;
    scrollTo(realIndex + 1);
  }, [realIndex, isTransitioning, scrollTo]);

  // Auto-scroll Logic
  useEffect(() => {
    if (!isUserInteracting) {
      autoScrollTimer.current = window.setInterval(() => {
        scrollNext();
      }, 5000);
    }

    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
      }
    };
  }, [isUserInteracting, scrollNext]);

  return (
    <section 
      id="testimonials" 
      className="py-16 md:py-24 bg-white relative overflow-hidden"
      onMouseEnter={() => setIsUserInteracting(true)}
      onMouseLeave={() => setIsUserInteracting(false)}
      onTouchStart={() => setIsUserInteracting(true)}
    >
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="font-serif text-3xl md:text-4xl text-stone-900 mb-3 md:mb-4">Client Love Notes</h2>
          <div className="h-1 w-20 bg-sage-500 mx-auto rounded-full"></div>
          <p className="mt-3 md:mt-4 text-stone-500 text-sm md:text-base">Real stories from real wardrobes.</p>
        </div>
        
        <div className="relative max-w-4xl mx-auto">
          {/* Navigation Arrows */}
          <button 
            onClick={scrollPrev}
            className="absolute -left-4 md:-left-16 top-1/2 -translate-y-1/2 z-20 p-2 text-stone-300 hover:text-sage-600 transition-colors hidden sm:block"
            aria-label="Previous testimonial"
          >
            <ChevronLeft size={40} strokeWidth={1.5} />
          </button>
          
          <button 
            onClick={scrollNext}
            className="absolute -right-4 md:-right-16 top-1/2 -translate-y-1/2 z-20 p-2 text-stone-300 hover:text-sage-600 transition-colors hidden sm:block"
            aria-label="Next testimonial"
          >
            <ChevronRight size={40} strokeWidth={1.5} />
          </button>

          {/* Swipable Gallery Container */}
          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {testimonials.map((t, idx) => (
              <div 
                key={`${t.id}-${idx}`} 
                className="flex-shrink-0 w-full snap-center px-4"
              >
                <div className="h-full bg-stone-50 p-6 md:p-12 rounded-3xl relative transition-all duration-500 border border-stone-100 flex flex-col shadow-sm">
                  <Quote className="absolute top-6 left-6 md:top-8 md:left-8 text-sage-500/10" size={48} aria-hidden />
                  
                  <div className="relative z-10 flex-grow pt-4 md:pt-6">
                    <p className="text-stone-700 leading-relaxed mb-6 md:mb-10 font-light italic text-base md:text-xl text-center">
                      "{t.text}"
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-3 md:gap-4 pt-6 md:pt-8 border-t border-stone-200/50 mt-auto">
                    <div className="h-12 w-12 md:h-16 md:w-16 rounded-full bg-sage-100 flex items-center justify-center text-sage-800 font-serif font-bold text-xl md:text-2xl flex-shrink-0">
                      {t.name[0]}
                    </div>
                    <div className="text-center">
                      <h4 className="font-serif font-bold text-xl text-stone-900 leading-tight">{t.name}</h4>
                      <span className="text-xs text-stone-400 uppercase tracking-[0.2em] font-semibold mt-1 block">{t.role}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dot Indicators */}
          <div className="flex justify-center gap-3 mt-8 md:mt-10">
            {originalTestimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => scrollTo(idx)}
                className={`h-1.5 transition-all duration-500 rounded-full ${realIndex === idx ? 'w-10 bg-sage-500' : 'w-2 bg-stone-200 hover:bg-stone-300'}`}
                aria-label={`Go to testimonial ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Aesthetic background elements */}
      <div className="absolute -left-20 top-1/2 w-64 h-64 bg-sage-50 rounded-full blur-3xl opacity-30 -z-10"></div>
      <div className="absolute -right-20 bottom-0 w-80 h-80 bg-stone-100 rounded-full blur-3xl opacity-50 -z-10"></div>
    </section>
  );
};