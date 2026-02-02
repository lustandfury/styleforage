import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Mail } from 'lucide-react';
import { FadeInOnScroll } from '../FadeInOnScroll';

export const Footer: React.FC = () => (
  <FadeInOnScroll className="relative z-30">
    <footer className="bg-stone-900 text-stone-100 py-10 md:py-12 pt-12 md:pt-12 border-t border-sage-500/30" role="contentinfo">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 md:gap-8 mb-6 md:mb-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="font-serif text-xl md:text-2xl text-stone-100 block mb-3 md:mb-4 hover:text-sage-300 transition-colors">
              Style Forage
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-stone-400">
              Elevating everyday style with intention and grace.
              Book your consultation today and step into your best self.
            </p>
          </div>
          <nav aria-label="Footer navigation">
            <h4 className="text-stone-100 font-medium mb-3 md:mb-4 text-sm md:text-base">Links</h4>
            <ul className="space-y-2 text-sm text-stone-400">
              <li><Link to="/" className="hover:text-sage-400 transition-colors">Home</Link></li>
              <li><Link to="/#about" className="hover:text-sage-400 transition-colors">About</Link></li>
              <li><Link to="/#services" className="hover:text-sage-400 transition-colors">Services</Link></li>
              <li><Link to="/#testimonials" className="hover:text-sage-400 transition-colors">Testimonials</Link></li>
              <li><Link to="/contact" className="hover:text-sage-400 transition-colors">Contact</Link></li>
              <li><Link to="/#services" className="text-sage-400 hover:text-sage-300 font-medium transition-colors">Book Now</Link></li>
            </ul>
          </nav>
          <div>
            <h4 className="text-stone-100 font-medium mb-3 md:mb-4 text-sm md:text-base">Connect</h4>
            <div className="flex gap-4 text-stone-400">
              <a href="https://instagram.com/styleforage" aria-label="Follow @styleforage on Instagram" className="hover:text-sage-400 transition-colors inline-flex items-center gap-2" target="_blank" rel="noopener noreferrer">
                <Instagram size={20} aria-hidden />
                <span>@styleforage</span>
              </a>
              <a href="mailto:hello@styleforage.com" aria-label="Email hello@styleforage.com" className="hover:text-sage-400 transition-colors inline-flex items-center gap-2">
                <Mail size={20} aria-hidden />
                <span className="sr-only">Email</span>
              </a>
            </div>
          </div>
        </div>
        <div className="pt-6 md:pt-8 border-t border-stone-800 text-stone-400 text-xs text-center flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span>© {new Date().getFullYear()} Style Forage. All rights reserved.</span>
          <span className="text-stone-600" aria-hidden>·</span>
          <a href="/sitemap.xml" className="hover:text-sage-400 transition-colors">Sitemap</a>
        </div>
      </div>
    </footer>
  </FadeInOnScroll>
);