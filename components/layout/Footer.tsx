import React from 'react';
import { Instagram, Mail } from 'lucide-react';

export const Footer: React.FC = () => (
  <footer className="bg-stone-900 text-stone-400 py-12 border-t border-stone-800">
    <div className="container mx-auto px-4">
      <div className="grid md:grid-cols-4 gap-8 mb-8">
        <div className="col-span-1 md:col-span-2">
          <span className="font-serif text-2xl text-stone-100 block mb-4">Style Forage</span>
          <p className="max-w-xs text-sm">
            Elevating everyday style with intention and grace. 
            Book your consultation today and step into your best self.
          </p>
        </div>
        <div>
          <h4 className="text-stone-100 font-medium mb-4">Links</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-white transition-colors">Home</a></li>
            <li><a href="#services" className="hover:text-white transition-colors">Services</a></li>
            <li><a href="#booking" className="hover:text-white transition-colors">Book Now</a></li>
            <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-stone-100 font-medium mb-4">Connect</h4>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors"><Instagram size={20} /></a>
            <a href="#" className="hover:text-white transition-colors"><Mail size={20} /></a>
          </div>
        </div>
      </div>
      <div className="pt-8 border-t border-stone-800 text-xs text-center">
        © {new Date().getFullYear()} Style Forage. All rights reserved.
      </div>
    </div>
  </footer>
);