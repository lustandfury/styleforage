import React from 'react';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';

export const Hero: React.FC = () => {
  const navigate = useNavigate();

  const scrollToAbout = () => {
    const element = document.getElementById('about');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToServices = () => {
    const element = document.getElementById('services');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative pt-24 pb-36 md:pt-40 md:pb-56 overflow-hidden">
      {/* Background Image Container */}
      <div className="absolute inset-0 -z-10">
         <img 
           src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1920&q=80" 
           alt="Chic wardrobe and fashion aesthetic" 
           className="w-full h-full object-cover"
         />
         {/* Light gradient for text legibility without obscuring the image */}
         <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/20 to-white/60"></div>
      </div>
      
      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-white/80 backdrop-blur-sm border border-stone-100 shadow-sm text-sage-700 text-xs font-bold uppercase tracking-[0.2em] animate-fade-in">
          Personal Styling • Wardrobe Curation
        </div>
        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-medium text-stone-900 mb-8 tracking-tight leading-[1.1]">
          Curating Confidence <br/> <span className="italic text-stone-700">In Every Detail.</span>
        </h1>
        <p className="text-stone-800 text-lg md:text-2xl max-w-2xl mx-auto mb-12 leading-relaxed font-light">
          Personal styling for those who want to feel intentional, current, and completely themselves.
        </p>
        <div className="flex flex-col sm:flex-row gap-5 justify-center">
          <Button size="lg" className="px-10 rounded-full shadow-lg shadow-stone-900/10" onClick={scrollToServices}>
            Start Your Journey
          </Button>
          <Button variant="outline" size="lg" className="px-10 rounded-full bg-white/50 backdrop-blur-md" onClick={scrollToAbout}>
            Learn More
          </Button>
        </div>
      </div>
    </section>
  );
};