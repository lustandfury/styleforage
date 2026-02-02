import React, { useRef, useState, useEffect } from 'react';

interface FadeInOnScrollProps {
  children: React.ReactNode;
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
  rootMargin = '0px 0px -24px 0px',
  threshold = 0.1,
  className = '',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        setIsVisible(true);
      },
      { rootMargin, threshold }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold]);

  const visibleClass = isVisible ? 'is-visible' : '';
  const combinedClass = `scroll-fade-in ${visibleClass} ${className}`.trim();

  return (
    <div ref={ref} className={combinedClass}>
      {children}
    </div>
  );
};
