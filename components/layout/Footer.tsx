import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Send } from 'lucide-react';

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
    <footer className="relative z-30 bg-stone-900 text-stone-100 pt-10 md:pt-12 pb-[max(6rem,calc(5rem+env(safe-area-inset-bottom)))] md:pb-12 border-t border-sage-500/30" role="contentinfo">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 md:gap-8 mb-6 md:mb-8">
            <div className="col-span-1 md:col-span-2">
              <Link to="/" className="font-serif text-xl md:text-2xl text-stone-100 block mb-3 md:mb-4 hover:text-sage-300 focus:text-sage-300 transition-colors focus:outline-none">
                Style Forage
              </Link>
              <p className="max-w-xs text-sm leading-relaxed text-stone-400">
                Styleforage is Roslyn Costanzo. I help elevate your everyday style with intention and grace.
                Book your consultation today and step into your best self.
              </p>
            </div>
            <nav aria-label="Footer navigation">
              <h4 className="text-stone-100 font-medium mb-3 md:mb-4 text-sm md:text-base">Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="text-stone-400 hover:text-sage-300 transition-colors focus:text-sage-300 focus:outline-none">Home</Link></li>
                <li><Link to="/#about" className="text-stone-400 hover:text-sage-300 transition-colors focus:text-sage-300 focus:outline-none">About</Link></li>
                <li><Link to="/#services" className="text-stone-400 hover:text-sage-300 transition-colors focus:text-sage-300 focus:outline-none">Services</Link></li>
                <li><Link to="/#testimonials" className="text-stone-400 hover:text-sage-300 transition-colors focus:text-sage-300 focus:outline-none">Testimonials</Link></li>
                <li><Link to="/contact" className="text-stone-400 hover:text-sage-300 transition-colors focus:text-sage-300 focus:outline-none">Contact</Link></li>
              </ul>
            </nav>
            <div>
              <h4 className="text-stone-100 font-medium mb-3 md:mb-4 text-sm md:text-base">Get in touch</h4>
              <a
                href="https://instagram.com/styleforage"
                aria-label="Follow @styleforage on Instagram"
                className="group inline-flex flex-row items-center justify-start gap-2 text-sm text-stone-400 hover:opacity-100 mb-4 block text-left transition-opacity duration-300 focus:outline-none"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="relative inline-flex items-center gap-2">
                  <span className="flex items-center gap-2 text-stone-400 transition-opacity duration-300 group-hover:opacity-0">
                    <Instagram size={18} aria-hidden className="shrink-0" />
                    Instagram @styleforage
                  </span>
                  <span
                    className="absolute inset-0 flex items-center gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-clip-text text-transparent"
                    style={{ backgroundImage: 'linear-gradient(to right, #FFDC80, #F77737, #E1306C, #C13584, #833AB4)' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="url(#footer-ig-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <defs>
                        <linearGradient id="footer-ig-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#FFDC80" />
                          <stop offset="25%" stopColor="#F77737" />
                          <stop offset="50%" stopColor="#E1306C" />
                          <stop offset="75%" stopColor="#C13584" />
                          <stop offset="100%" stopColor="#833AB4" />
                        </linearGradient>
                      </defs>
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                    Instagram @styleforage
                  </span>
                </span>
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
                    className="w-full px-3 py-1.5 text-sm bg-stone-800 border border-stone-700 rounded-lg text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent"
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
                    className="w-full px-3 py-1.5 text-sm bg-stone-800 border border-stone-700 rounded-lg text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent resize-none"
                  />
                </div>
                {status === 'success' && (
                  <p className="text-xs text-sage-400" role="status">Thanks! We&apos;ll be in touch.</p>
                )}
                {status === 'error' && (
                  <p className="text-xs text-red-400" role="alert">Something went wrong. Try the <Link to="/contact" className="underline hover:text-sage-300 focus:text-sage-300 focus:outline-none">Contact page</Link>.</p>
                )}
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg border-2 border-sage-500 text-sage-400 bg-transparent hover:bg-sage-500/10 hover:text-sage-300 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:ring-offset-2 focus:ring-offset-stone-900 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
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
  );
};
