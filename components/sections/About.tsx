import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Link } from 'react-router-dom';

export const About: React.FC = () => {
  return (
    <section id="about" className="py-24 bg-white relative overflow-hidden">
       {/* Background Decoration */}
       <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-sage-50 rounded-full blur-3xl opacity-50 -z-10"></div>
       
       <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
             <div className="order-2 md:order-1">
                <div className="mb-6 text-sage-600 font-medium uppercase tracking-wider text-sm">About the Stylist</div>
                <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-stone-900 leading-tight mb-8">
                  Effortless style for <br/> every body & every budget.
                </h2>
                <div className="pl-6 border-l-2 border-sage-200">
                   <h3 className="font-serif text-xl font-bold text-stone-900 mb-4">Roslyn Costanzo</h3>
                   <div className="space-y-5 text-stone-600 leading-relaxed font-light">
                      <p>
                        Hi, I'm Roz and I've been obsessed with fashion and shopping since I got my first pay cheque in 1992—which I immediately spent at Smart Set. I have also worked as a style editor at two national lifestyle magazines, and most recently, as a wardrobe consultant, helping people like you, find and refine their personal style.
                      </p>
                      <p>
                        Styling is all about helping people feel their best because when you look good, you feel good. If you need a boost and are tired of feeling frustrated every time you get dressed for the day, give me a call!
                      </p>
                   </div>
                   <div className="mt-8 flex flex-col sm:flex-row gap-4">
                      <Link to="/services">
                        <Button>Book a Session</Button>
                      </Link>
                      <a 
                        href="https://instagram.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center px-4 py-2 text-stone-700 hover:text-stone-900 font-medium transition-colors"
                      >
                        Follow on Instagram <ArrowRight size={16} className="ml-2"/>
                      </a>
                   </div>
                </div>
             </div>
             <div className="order-1 md:order-2 relative">
                <div className="aspect-[4/5] rounded-none md:rounded-lg overflow-hidden relative z-10 shadow-2xl">
                  <img 
                    src="roz.png" 
                    onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80" }}
                    alt="Roslyn Costanzo" 
                    className="w-full h-full object-cover"
                    loading="lazy"
                    width="800"
                    height="1000"
                  />
                </div>
                {/* Decorative Frame */}
                <div className="absolute -bottom-6 -right-6 w-full h-full border-2 border-sage-200 rounded-lg -z-0 hidden md:block"></div>
             </div>
          </div>
       </div>
    </section>
  );
};