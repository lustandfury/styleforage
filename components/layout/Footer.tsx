import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Send } from 'lucide-react';
import { FadeInOnScroll } from '../FadeInOnScroll';

const FOOTER_FORM_NAME = 'footer-contact';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      const payload = new URLSearchParams({
        'form-name': FOOTER_FORM_NAME,
        email,
        message,
      }).toString();
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: payload,
      });
      if (res.ok) {
        setStatus('success');
        setEmail('');
        setMessage('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <FadeInOnScroll className="relative z-30">
      <footer className="bg-stone-900 text-stone-100 pt-10 md:pt-12 pb-[max(6rem,calc(5rem+env(safe-area-inset-bottom)))] md:pb-12 border-t border-sage-500/30" role="contentinfo">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 md:gap-8 mb-6 md:mb-8">
            <div className="col-span-1 md:col-span-2">
              <Link to="/" className="font-serif text-xl md:text-2xl text-stone-100 block mb-3 md:mb-4 hover:text-sage-300 transition-colors">
                Style Forage
              </Link>
              <p className="max-w-xs text-sm leading-relaxed text-stone-400">
                Styleforage is Roslyn Costanzo. I help elevate your everyday style with intention and grace.
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
              </ul>
            </nav>
            <div>
              <h4 className="text-stone-100 font-medium mb-3 md:mb-4 text-sm md:text-base">Get in touch</h4>
              <a href="https://instagram.com/styleforage" aria-label="Follow @styleforage on Instagram" className="hover:text-sage-400 transition-colors inline-flex flex-row items-center gap-2 text-sm text-stone-400 mb-4 block" target="_blank" rel="noopener noreferrer">
                <Instagram size={18} aria-hidden className="shrink-0 order-first" />
                <span>Instagram @styleforage</span>
              </a>
              <form
                name={FOOTER_FORM_NAME}
                method="post"
                data-netlify="true"
                data-netlify-honeypot="bot-field"
                onSubmit={handleSubmit}
                className="space-y-3"
              >
                <input type="hidden" name="form-name" value={FOOTER_FORM_NAME} />
                <p className="sr-only">
                  <label htmlFor="footer-bot">Don't fill this out</label>
                  <input id="footer-bot" name="bot-field" type="text" tabIndex={-1} autoComplete="off" />
                </p>
                <div>
                  <label htmlFor="footer-email" className="sr-only">Email</label>
                  <input
                    id="footer-email"
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Your email"
                    className="w-full px-3 py-2 text-sm bg-stone-800 border border-stone-700 rounded-lg text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="footer-message" className="sr-only">Message</label>
                  <textarea
                    id="footer-message"
                    name="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    placeholder="Message"
                    rows={2}
                    className="w-full px-3 py-2 text-sm bg-stone-800 border border-stone-700 rounded-lg text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent resize-none"
                  />
                </div>
                {status === 'success' && (
                  <p className="text-xs text-sage-400" role="status">Thanks! We&apos;ll be in touch.</p>
                )}
                {status === 'error' && (
                  <p className="text-xs text-red-400" role="alert">Something went wrong. Try the <Link to="/contact" className="underline hover:text-sage-400">Contact page</Link>.</p>
                )}
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border-2 border-sage-500 text-sage-400 bg-transparent hover:bg-sage-500/10 hover:text-sage-300 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:ring-offset-2 focus:ring-offset-stone-900 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  {status === 'submitting' ? 'Sending…' : <><Send size={14} aria-hidden />Send</>}
                </button>
              </form>
            </div>
          </div>
          <div className="pt-6 md:pt-8 border-t border-stone-800 text-stone-400 text-xs grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-0 items-center">
            <span className="text-left">© {new Date().getFullYear()} Style Forage. All rights reserved.</span>
            <a href="/sitemap.xml" className="hover:text-sage-400 transition-colors text-center order-last md:order-none">Sitemap</a>
            <a href="https://thefaintsignal.com/" target="_blank" rel="noopener noreferrer" className="hover:text-sage-400 transition-colors text-right">Made with ❤️ & 🤖 by The Faint Signal</a>
          </div>
        </div>
      </footer>
    </FadeInOnScroll>
  );
};
