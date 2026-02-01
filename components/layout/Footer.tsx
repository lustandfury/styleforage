import React from 'react';
import { Instagram, Mail } from 'lucide-react';
import { FadeInOnScroll } from '../FadeInOnScroll';

export const Footer: React.FC = () => (
  <FadeInOnScroll>
    <footer className="bg-stone-900 text-stone-100 py-10 md:py-12 border-t border-sage-500/30">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 md:gap-8 mb-6 md:mb-8">
          <div className="col-span-1 md:col-span-2">
            <span className="font-serif text-xl md:text-2xl text-stone-100 block mb-3 md:mb-4">Style Forage</span>
            <p className="max-w-xs text-sm leading-relaxed text-stone-400">
              Elevating everyday style with intention and grace.
              Book your consultation today and step into your best self.
            </p>
          </div>
          <div>
            <h4 className="text-stone-100 font-medium mb-3 md:mb-4 text-sm md:text-base">Links</h4>
            <ul className="space-y-2 text-sm text-stone-400">
              <li><a href="#" className="hover:text-sage-400 transition-colors cursor-pointer">Home</a></li>
              <li><a href="#services" className="hover:text-sage-400 transition-colors cursor-pointer">Services</a></li>
              <li><a href="#booking" className="hover:text-sage-400 transition-colors cursor-pointer">Book Now</a></li>
              <li><a href="#" className="hover:text-sage-400 transition-colors cursor-pointer">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-stone-100 font-medium mb-3 md:mb-4 text-sm md:text-base">Connect</h4>
            <div className="flex gap-4 text-stone-400">
              <a href="https://instagram.com/styleforage" aria-label="Follow us on Instagram" className="hover:text-sage-400 transition-colors cursor-pointer" target="_blank" rel="noopener noreferrer">
                <Instagram size={20} aria-hidden="true" />
              </a>
              <a href="mailto:hello@styleforage.com" aria-label="Send us an email" className="hover:text-sage-400 transition-colors cursor-pointer">
                <Mail size={20} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
        <div className="pt-6 md:pt-8 border-t border-stone-800 text-stone-400 text-xs text-center">
          © {new Date().getFullYear()} Style Forage. All rights reserved.
        </div>
      </div>
    </footer>
  </FadeInOnScroll>
);