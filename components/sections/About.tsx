import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Link } from 'react-router-dom';
import { FadeInOnScroll } from '../FadeInOnScroll';

export const About: React.FC = () => {
  const [isHoveringInstagram, setIsHoveringInstagram] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Preload video after page loads
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.load();
    }
  }, []);

  // Play/pause video based on hover state
  useEffect(() => {
    const video = videoRef.current;
    if (video && isVideoReady) {
      if (isHoveringInstagram) {
        video.currentTime = 0;
        video.play();
      } else {
        video.pause();
      }
    }
  }, [isHoveringInstagram, isVideoReady]);

  return (
    <section id="about" className="py-16 md:py-24 bg-white relative overflow-hidden">
       {/* Background Decoration */}
       <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-sage-50 rounded-full blur-3xl -z-10"></div>
       
       <FadeInOnScroll>
       <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
             <div className="order-2 md:order-1">
                <div className="mb-4 md:mb-6 text-sage-600 font-medium uppercase tracking-wider text-sm">About the Stylist</div>
                <h2 className="font-serif text-3xl md:text-5xl lg:text-6xl text-stone-900 leading-tight mb-6 md:mb-8">
                Roslyn Costanzo
                </h2>
                <div className="pl-4 md:pl-6 relative">
                   {/* Left border with gradient animation on hover */}
                   <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-stone-900" />
                   <div 
                     className={`absolute left-0 bottom-0 w-0.5 transition-all duration-500 ease-out ${
                       isHoveringInstagram ? 'h-full' : 'h-0'
                     }`}
                     style={{ background: 'linear-gradient(to top, #FFDC80, #F77737, #E1306C, #C13584, #833AB4)' }}
                   />
                   <div className="space-y-4 md:space-y-5 text-stone-600 text-sm md:text-base leading-relaxed font-light">
                      <p>
                        Hi, I'm Roz and I've been obsessed with fashion and shopping since I got my first pay cheque in 1992—which I immediately spent at Smart Set. I have also worked as a style editor at two national lifestyle magazines, and most recently, as a wardrobe consultant, helping people like you, find and refine their personal style.
                      </p>
                      <p>
                        Styling is all about helping people feel their best because when you look good, you feel good. If you need a boost and are tired of feeling frustrated every time you get dressed for the day, give me a call!
                      </p>
                   </div>
                   <div className="mt-6 md:mt-8 flex flex-col sm:flex-row gap-3 md:gap-4">
                      <a 
                        href="https://www.instagram.com/styleforage/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group inline-flex items-center justify-center py-2 font-medium transition-colors"
                        onMouseEnter={() => setIsHoveringInstagram(true)}
                        onMouseLeave={() => setIsHoveringInstagram(false)}
                      >
                        {/* Text with gradient on hover */}
                        <span className="relative">
                          <span className="text-stone-700 transition-opacity duration-300 group-hover:opacity-0">
                            @styleforage on Instagram
                          </span>
                          <span 
                            className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-clip-text text-transparent"
                            style={{ backgroundImage: 'linear-gradient(to right, #FFDC80, #F77737, #E1306C, #C13584, #833AB4)' }}
                          >
                            @styleforage on Instagram
                          </span>
                        </span>
                        {/* Arrow with gradient on hover */}
                        <span className="relative ml-2 w-4 h-4 flex-shrink-0">
                          <ArrowRight size={16} className="absolute inset-0 text-stone-700 transition-all duration-300 group-hover:opacity-0 group-hover:translate-x-1"/>
                          <svg 
                            className="absolute inset-0 w-4 h-4 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1"
                            viewBox="0 0 24 24" 
                            fill="none"
                            stroke="url(#instagram-gradient-text)"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <defs>
                              <linearGradient id="instagram-gradient-text" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#FFDC80" />
                                <stop offset="25%" stopColor="#F77737" />
                                <stop offset="50%" stopColor="#E1306C" />
                                <stop offset="75%" stopColor="#C13584" />
                                <stop offset="100%" stopColor="#833AB4" />
                              </linearGradient>
                            </defs>
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                          </svg>
                        </span>
                      </a>
                   </div>
                </div>
             </div>
             <div className="order-1 md:order-2 flex justify-center">
                {/* Wrapper for image and border - relative positioning context */}
                <div className="relative h-[90vh] aspect-[9/16]">
                  {/* Decorative Frame - absolutely positioned relative to wrapper */}
                  <div 
                    className={`absolute top-4 left-4 w-full h-full rounded-2xl md:rounded-3xl hidden md:block transition-all duration-500 ${
                      isHoveringInstagram ? '' : 'border-2 border-stone-900'
                    }`}
                    style={isHoveringInstagram ? { 
                      background: 'linear-gradient(to bottom, #833AB4, #C13584, #E1306C, #F77737, #FFDC80)'
                    } : {}}
                  />
                  
                  {/* Image container */}
                  <div className="relative z-10 w-full h-full rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl bg-stone-100">
                    {/* Video - preloaded and always in DOM, visibility toggled */}
                    <video 
                      ref={videoRef}
                      src="/images/gallary/roz-in-capris.mp4"
                      muted
                      loop
                      playsInline
                      preload="auto"
                      onCanPlayThrough={() => setIsVideoReady(true)}
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                        isHoveringInstagram && isVideoReady ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                    {/* Image - always visible underneath */}
                    <img 
                      src="roz.png" 
                      onError={(e) => { e.currentTarget.src = "/images/Roz-closet.avif" }}
                      alt="Roslyn Costanzo" 
                      className={`w-full h-full object-cover transition-opacity duration-300 ${
                        isHoveringInstagram && isVideoReady ? 'opacity-0' : 'opacity-100'
                      }`}
                      loading="lazy"
                      width="800"
                      height="1000"
                    />
                  </div>
                </div>
             </div>
          </div>
       </div>
       </FadeInOnScroll>
    </section>
  );
};