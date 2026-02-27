import React, { Suspense, lazy, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Hero } from '../components/sections/Hero';
import { About } from '../components/sections/About';

const ThoughtfulApproach = lazy(() =>
  import('../components/sections/ThoughtfulApproach').then((module) => ({ default: module.ThoughtfulApproach }))
);
const Services = lazy(() =>
  import('../components/sections/Services').then((module) => ({ default: module.Services }))
);
const FooterRevealSection = lazy(() =>
  import('../components/sections/FooterRevealSection').then((module) => ({ default: module.FooterRevealSection }))
);

export const Home: React.FC = () => {
  // On load/refresh, always start at top so hero animation plays from the beginning
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="animate-fade-in">
      <Helmet>
        <title>Style Forage | Personal Styling & Wardrobe Consultation</title>
        <meta name="description" content="Curating confidence in every detail. Personal styling services including closet edits, wardrobe consultations, and personal shopping." />
      </Helmet>

      {/* Hero: fixed, full viewport */}
      <div className="fixed inset-0 z-10 h-screen w-full">
        <Hero />
      </div>

      {/* Spacer so content starts below viewport */}
      <div className="relative z-0 h-screen" aria-hidden="true" />

      {/* Content scrolls over hero */}
      <div className="relative z-20">
        <About />
        <Suspense fallback={<section aria-hidden="true" className="py-16 md:py-24" />}>
          <ThoughtfulApproach />
        </Suspense>
        <Suspense fallback={<section aria-hidden="true" className="py-20 md:py-32" />}>
          <Services />
        </Suspense>
        {/* Section anchored above footer: letter-by-letter reveal CTA */}
        <Suspense fallback={<section aria-hidden="true" className="py-16 md:py-24" />}>
          <FooterRevealSection />
        </Suspense>
      </div>
    </div>
  );
};
