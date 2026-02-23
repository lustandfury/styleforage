import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { FadeInOnScroll } from '../FadeInOnScroll';
import { EditorialSectionHeader } from '../EditorialSectionHeader';

// Match CodePen stacked cards: items = 3 visible, elementsMargin = 10, stackedOptions = 'Top'
const ITEMS = 3;
const ELEMENTS_MARGIN = 10;
const EL_TRANS_TOP = ELEMENTS_MARGIN * (ITEMS - 1); // 20px – front card offset in Top mode

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
    text: "I loved working with Roz because she knows fashion and she knew the right fashion for me. She thrives on helping people look and feel good. Her sweet personality and non-judgemental approach made the wardrobe consultation and in-store shop a delightful experience! My family says I've never looked so beautiful and confident.",
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

const N = originalTestimonials.length;

const AUTO_CYCLE_MS = 5000;
const RESUME_DELAY_MS = 5000;
const CYCLE_TICK_MS = 50;

function getStackStyle(
  cardIndex: number,
  currentPosition: number
): { scale: number; translateY: number; zIndex: number; opacity: number; visible: boolean } {
  const inWindow =
    cardIndex === currentPosition ||
    cardIndex === (currentPosition + 1) % N ||
    cardIndex === (currentPosition + 2) % N;

  if (!inWindow) {
    return {
      scale: 1 - ITEMS * 0.04,
      translateY: EL_TRANS_TOP,
      zIndex: 0,
      opacity: 0,
      visible: false,
    };
  }

  // Which of the 3 visible slots (0=front, 1=middle, 2=back)
  let pos = 0;
  if (cardIndex === currentPosition) pos = 0;
  else if (cardIndex === (currentPosition + 1) % N) pos = 1;
  else pos = 2;

  // CodePen updateUi() for Top: elTrans = elTransInc * elTransTop, then elTransTop--
  // pos 0 (front): scale 1,    translateY(20), z 5, opacity 1
  // pos 1 (mid):   scale 0.96, translateY(10), z 4, opacity ~0.67
  // pos 2 (back):  scale 0.92, translateY(0),  z 3, opacity ~0.33
  const elScale = 1 - pos * 0.04;
  const elTrans = ELEMENTS_MARGIN * (ITEMS - 1 - pos);
  const elZindex = 5 - pos;
  const elOpac = 1 - (pos / ITEMS);

  return {
    scale: elScale,
    translateY: elTrans,
    zIndex: elZindex,
    opacity: elOpac,
    visible: true,
  };
}

export const Testimonials: React.FC = () => {
  const autoScrollTimer = useRef<number | null>(null);
  const resumeTimeoutRef = useRef<number | null>(null);
  const cycleStartRef = useRef(Date.now());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [cycleProgress, setCycleProgress] = useState(0);

  const clearResumeTimeout = useCallback(() => {
    if (resumeTimeoutRef.current != null) {
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
  }, []);

  const scheduleResume = useCallback(() => {
    clearResumeTimeout();
    resumeTimeoutRef.current = window.setTimeout(() => {
      resumeTimeoutRef.current = null;
      setIsUserInteracting(false);
    }, RESUME_DELAY_MS);
  }, [clearResumeTimeout]);

  const goTo = useCallback((index: number) => {
    setIsTransitioning(true);
    setCurrentIndex((index + N) % N);
    setTimeout(() => setIsTransitioning(false), 400);
  }, []);

  const scrollPrev = useCallback(() => {
    if (isTransitioning) return;
    setIsUserInteracting(true);
    scheduleResume();
    goTo(currentIndex - 1);
  }, [isTransitioning, currentIndex, goTo, scheduleResume]);

  const scrollNext = useCallback(() => {
    if (isTransitioning) return;
    goTo(currentIndex + 1);
  }, [currentIndex, isTransitioning, goTo]);

  const handleNextClick = useCallback(() => {
    setIsUserInteracting(true);
    scheduleResume();
    scrollNext();
  }, [scrollNext, scheduleResume]);

  const handleMouseEnter = useCallback(() => {
    clearResumeTimeout();
    setIsUserInteracting(true);
  }, [clearResumeTimeout]);

  const handleMouseLeave = useCallback(() => {
    clearResumeTimeout();
    setIsUserInteracting(false);
  }, [clearResumeTimeout]);

  const handleTouchStart = useCallback(() => {
    clearResumeTimeout();
    setIsUserInteracting(true);
  }, [clearResumeTimeout]);

  const handleTouchEnd = useCallback(() => {
    scheduleResume();
  }, [scheduleResume]);

  const handleDotClick = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsUserInteracting(true);
    scheduleResume();
    goTo(index);
  }, [goTo, scheduleResume, isTransitioning]);

  useEffect(() => {
    if (!isUserInteracting) {
      autoScrollTimer.current = window.setInterval(() => scrollNext(), AUTO_CYCLE_MS);
    }
    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
        autoScrollTimer.current = null;
      }
    };
  }, [isUserInteracting, scrollNext]);

  useEffect(() => () => clearResumeTimeout(), [clearResumeTimeout]);

  useEffect(() => {
    cycleStartRef.current = Date.now();
    setCycleProgress(0);
  }, [currentIndex]);

  useEffect(() => {
    if (!isUserInteracting) {
      cycleStartRef.current = Date.now();
      setCycleProgress(0);
    }
  }, [isUserInteracting]);

  useEffect(() => {
    if (isUserInteracting) return;
    const tick = () => {
      setCycleProgress(Math.min(1, (Date.now() - cycleStartRef.current) / AUTO_CYCLE_MS));
    };
    const id = window.setInterval(tick, CYCLE_TICK_MS);
    return () => clearInterval(id);
  }, [isUserInteracting]);

  return (
    <section id="testimonials" className="pt-16 md:pt-24 pb-4 relative">
      <FadeInOnScroll>
        <div className="container mx-auto px-4 relative z-10">
          <EditorialSectionHeader
            number="04"
            label="Testimonials"
            heading="Client Love"
            description="Real stories from real wardrobes."
          />

          <div className="relative max-w-2xl mx-auto">
            <button
              onClick={scrollPrev}
              className="absolute -left-4 md:-left-16 top-1/2 -translate-y-1/2 z-20 p-2 text-stone-500 hover:text-sage-600 transition-colors hidden sm:flex items-center justify-center cursor-pointer"
              aria-label="Previous testimonial"
            >
              <ChevronLeft size={40} strokeWidth={1.5} />
            </button>
            <button
              onClick={handleNextClick}
              className="absolute -right-4 md:-right-16 top-1/2 -translate-y-1/2 z-20 p-2 text-stone-500 hover:text-sage-600 transition-colors hidden sm:flex items-center justify-center cursor-pointer"
              aria-label="Next testimonial"
            >
              <ChevronRight size={40} strokeWidth={1.5} />
            </button>

            {/* CodePen structure: stackedcards > stackedcards-container > card-items; first card position relative */}
            <div
              className="stackedcards stackedcards--animatable relative select-none"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="stackedcards-container relative w-full"
                style={{ marginBottom: `${ELEMENTS_MARGIN * (ITEMS - 1)}px` }}
              >
                {originalTestimonials.map((t, i) => {
                  const stack = getStackStyle(i, currentIndex);
                  const isFirst = i === 0;

                  return (
                    <div
                      key={t.id}
                      className={[
                        'stackedcards-top stackedcards--animatable stackedcards-origin-top card-item',
                        isFirst ? 'relative block' : 'absolute left-0 right-0 top-0',
                      ].join(' ')}
                      style={{
                        width: '100%',
                        height: isFirst ? undefined : '100%',
                        minHeight: '300px',
                        willChange: 'transform, opacity',
                        borderRadius: '10px',
                        transform: `scale(${stack.scale}) translateX(0) translateY(${stack.translateY}px) translateZ(0)`,
                        zIndex: stack.zIndex,
                        opacity: stack.opacity,
                        pointerEvents: stack.visible && stack.zIndex === 5 ? 'auto' : 'none',
                      }}
                    >
                      <div className="h-full min-h-[300px] bg-white rounded-2xl md:rounded-3xl border border-stone-200 flex flex-col shadow-lg overflow-hidden p-6 md:p-10 relative">
                        <div
                          className="absolute inset-0 opacity-[0.06] pointer-events-none rounded-2xl md:rounded-3xl"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill='none' stroke='%23757575' stroke-width='0.5'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z'/%3E%3Ccircle cx='30' cy='30' r='1' fill='%23757575'/%3E%3Ccircle cx='0' cy='30' r='1' fill='%23757575'/%3E%3Ccircle cx='60' cy='30' r='1' fill='%23757575'/%3E%3Ccircle cx='30' cy='0' r='1' fill='%23757575'/%3E%3Ccircle cx='30' cy='60' r='1' fill='%23757575'/%3E%3C/g%3E%3C/svg%3E")`,
                            backgroundSize: '60px 60px',
                          }}
                          aria-hidden
                        />
                        <Quote className="absolute top-6 left-6 md:top-8 md:left-8 text-sage-500/10" size={48} aria-hidden />
                        <div className="relative z-10 flex-grow pt-4 md:pt-6 flex flex-col">
                          <p className="font-sans text-stone-700 leading-relaxed mb-6 md:mb-8 font-light italic text-lg md:text-xl text-center flex-grow">
                            "{t.text}"
                          </p>
                        </div>
                        <div className="flex flex-col items-center pt-6 md:pt-8 border-t border-stone-200 mt-auto">
                          <h4 className="font-serif font-bold text-xl text-stone-900 leading-tight">{t.name}</h4>
                          <span className="text-xs text-stone-400 uppercase tracking-[0.2em] font-semibold mt-1 block">{t.role}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-center gap-3 mt-8 md:mt-10 items-center">
              {originalTestimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => handleDotClick(idx)}
                  className={`h-1.5 rounded-full cursor-pointer overflow-hidden flex-shrink-0 ${currentIndex === idx ? 'w-10' : 'w-2'} transition-[width] duration-300`}
                  aria-label={`Go to testimonial ${idx + 1}`}
                >
                  {currentIndex === idx ? (
                    <span className="block h-full w-full rounded-full bg-stone-400">
                      <span
                        className="block h-full rounded-full bg-sage-500 transition-none"
                        style={{ width: `${cycleProgress * 100}%` }}
                      />
                    </span>
                  ) : (
                    <span className="block h-full w-full rounded-full bg-stone-400 hover:bg-stone-500 transition-colors" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </FadeInOnScroll>
    </section>
  );
};
