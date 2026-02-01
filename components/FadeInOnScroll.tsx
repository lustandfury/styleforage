import React, { useRef, useState, useEffect } from 'react';

interface FadeInOnScrollProps {
  children: React.ReactNode;
  /** Optional delay in ms before animation starts (e.g. for stagger) */
  delay?: number;
  /** Root margin for Intersection Observer (e.g. "0px 0px -40px 0px" to trigger slightly before in view) */
  rootMargin?: string;
  /** Threshold 0–1 for how much of the element must be visible */
  threshold?: number;
  className?: string;
}

/**
 * Wraps content and applies a subtle fade-in animation when the element
 * enters the viewport. The animation runs only once.
 */
export const FadeInOnScroll: React.FC<FadeInOnScrollProps> = ({
  children,
  delay = 0,
  rootMargin = '0px 0px -24px 0px',
  threshold = 0.1,
  className = '',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        if (delay > 0) {
          timeoutId = setTimeout(() => setIsVisible(true), delay);
        } else {
          setIsVisible(true);
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timeoutId != null) clearTimeout(timeoutId);
    };
  }, [rootMargin, threshold, delay]);

  const visibleClass = isVisible ? 'is-visible' : '';
  const combinedClass = `scroll-fade-in ${visibleClass} ${className}`.trim();

  return (
    <div ref={ref} className={combinedClass}>
      {children}
    </div>
  );
};
