import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Hero } from '../components/sections/Hero';
import { About } from '../components/sections/About';
import { ThoughtfulApproach } from '../components/sections/ThoughtfulApproach';
import { Services } from '../components/sections/Services';
import { Testimonials } from '../components/sections/Testimonials';
import { FooterRevealSection } from '../components/sections/FooterRevealSection';

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
        <link rel="canonical" href="https://styleforage.com/" />
        <meta property="og:url" content="https://styleforage.com/" />
        <meta property="og:title" content="Style Forage | Personal Styling & Wardrobe Consultation" />
        <meta property="og:description" content="Curating confidence in every detail. Personal styling services including closet edits, wardrobe consultations, and personal shopping." />
        <meta property="og:image" content="https://styleforage.com/images/meta-image.webp" />
        <meta property="twitter:url" content="https://styleforage.com/" />
        <meta property="twitter:title" content="Style Forage | Personal Styling & Wardrobe Consultation" />
        <meta property="twitter:description" content="Curating confidence in every detail. Personal styling services including closet edits, wardrobe consultations, and personal shopping." />
        <meta property="twitter:image" content="https://styleforage.com/images/meta-image.webp" />
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
        <ThoughtfulApproach />
        <Services />
        {/* Section anchored above footer: letter-by-letter reveal CTA */}
        <FooterRevealSection />
      </div>
    </div>
  );
};
