import React from 'react';
import { Link } from 'react-router-dom';
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
              <li><Link to="/" className="hover:text-sage-400 transition-colors cursor-pointer">Home</Link></li>
              <li><Link to="/#about" className="hover:text-sage-400 transition-colors cursor-pointer">About</Link></li>
              <li><Link to="/#services" className="hover:text-sage-400 transition-colors cursor-pointer">Services</Link></li>
              <li><Link to="/#testimonials" className="hover:text-sage-400 transition-colors cursor-pointer">Testimonials</Link></li>
              <li><Link to="/#services" className="hover:text-sage-400 transition-colors cursor-pointer">Book Now</Link></li>
              <li><Link to="/contact" className="hover:text-sage-400 transition-colors cursor-pointer">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-stone-100 font-medium mb-3 md:mb-4 text-sm md:text-base">Connect</h4>
            <div className="flex gap-4 text-stone-400">
              <a href="https://instagram.com/styleforage" aria-label="Follow @styleforage on Instagram" className="hover:text-sage-400 transition-colors cursor-pointer inline-flex items-center gap-2" target="_blank" rel="noopener noreferrer">
                <Instagram size={20} aria-hidden="true" />
                <span>@styleforage</span>
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