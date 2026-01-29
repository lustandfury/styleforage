import React from 'react';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';

export const Hero: React.FC = () => {
  const navigate = useNavigate();

  const scrollToServices = () => {
    const element = document.getElementById('services');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative pt-24 pb-28 md:pt-40 md:pb-56 overflow-hidden">
      {/* Background Image Container */}
      <div className="absolute inset-0 -z-10">
         <img 
           src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1920&q=80" 
           alt="Chic wardrobe and fashion aesthetic" 
           className="w-full h-full object-cover"
         />
         {/* White-to-transparent gradient from bottom (solid) to top over lower 50% so hero text stands out */}
         <div 
           className="absolute inset-0" 
           style={{ background: 'linear-gradient(to top, rgba(255,255,255,1) 40%, transparent 80%)' }}
         />
      </div>
      
      <div className="container mx-auto px-4 max-w-4xl text-center relative z-10">
        <div className="inline-block px-4 py-1.5 mb-4 md:mb-6 rounded-full bg-white/80 backdrop-blur-sm border border-stone-100 shadow-sm text-sage-700 text-xs font-bold uppercase tracking-[0.2em] animate-fade-in">
          Personal Styling • Wardrobe Curation
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-medium text-stone-900 mb-6 md:mb-8 tracking-tight leading-[1.1]">
        Effortless style for every<br/> <span className="italic text-stone-700">body & budget</span>
        </h1>
        <p className="text-stone-800 text-base sm:text-lg md:text-2xl max-w-2xl mx-auto mb-10 md:mb-12 leading-relaxed font-light">
          Personal styling for women and men who want to feel confident, current, and completely themselves.
        </p>
        <div className="flex justify-center">
          <Button size="lg" className="w-full sm:w-auto px-10 rounded-full shadow-lg shadow-stone-900/10" onClick={scrollToServices}>
            View Services
          </Button>
        </div>
      </div>
    </section>
  );
};