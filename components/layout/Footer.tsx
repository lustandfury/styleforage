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
    <footer
      data-nav-theme="dark"
      className="relative z-30 mobile-menu-leather text-white pt-10 md:pt-12 pb-[max(6rem,calc(5rem+env(safe-area-inset-bottom)))] md:pb-12 border-t border-sage-800"
      role="contentinfo"
    >
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-6 md:mb-8">

          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link
              to="/"
              className="font-serif text-xl md:text-2xl text-white block mb-3 md:mb-4 hover:text-sage-300 transition-colors focus:outline-none"
            >
              Style Forage
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-sage-300">
              Style Forage is Roslyn Costanzo. I help elevate your everyday style with intention and grace.
              Book your consultation today and step into your best self.
            </p>
          </div>

          {/* Nav links */}
          <nav aria-label="Footer navigation">
            <h4 className="text-sage-200 font-sans text-xs uppercase tracking-[0.2em] mb-3 md:mb-4">Links</h4>
            <ul className="space-y-2 text-sm">
              {[
                { to: '/',             label: 'Home' },
                { to: '/#about',       label: 'About' },
                { to: '/#services',    label: 'Services' },
                { to: '/#testimonials',label: 'Testimonials' },
                { to: '/contact',      label: 'Contact' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sage-400 hover:text-sage-200 transition-colors focus:text-sage-200 focus:outline-none"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact + quick form */}
          <div>
            <h4 className="text-sage-200 font-sans text-xs uppercase tracking-[0.2em] mb-3 md:mb-4">Get in touch</h4>
            <a
              href="https://instagram.com/styleforage"
              aria-label="Follow @styleforage on Instagram"
              className="group inline-flex items-center gap-2 text-sm text-sage-400 hover:text-sage-200 mb-5 transition-colors focus:outline-none"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="relative flex items-center gap-2">
                <span className="flex items-center gap-2 transition-opacity duration-300 group-hover:opacity-0">
                  <Instagram size={16} aria-hidden className="shrink-0" />
                  @styleforage
                </span>
                <span
                  className="absolute inset-0 flex items-center gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(to right, #FFDC80, #F77737, #E1306C, #C13584, #833AB4)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="url(#footer-ig-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <defs>
                      <linearGradient id="footer-ig-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%"   stopColor="#FFDC80" />
                        <stop offset="25%"  stopColor="#F77737" />
                        <stop offset="50%"  stopColor="#E1306C" />
                        <stop offset="75%"  stopColor="#C13584" />
                        <stop offset="100%" stopColor="#833AB4" />
                      </linearGradient>
                    </defs>
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                  @styleforage
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
                  className="w-full px-3 py-2 text-sm rounded-sm bg-sage-800/40 border border-sage-700 text-white placeholder-sage-600 focus:outline-none focus:ring-1 focus:ring-sage-500 focus:border-sage-500 transition-colors"
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
                  className="w-full px-3 py-2 text-sm rounded-sm bg-sage-800/40 border border-sage-700 text-white placeholder-sage-600 focus:outline-none focus:ring-1 focus:ring-sage-500 focus:border-sage-500 transition-colors resize-none"
                />
              </div>
              {status === 'success' && (
                <p className="text-xs text-sage-400" role="status">Thanks! We'll be in touch.</p>
              )}
              {status === 'error' && (
                <p className="text-xs text-red-400" role="alert">
                  Something went wrong. Try the <Link to="/contact" className="underline hover:text-sage-300 focus:outline-none">Contact page</Link>.
                </p>
              )}
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-sm border border-sage-600 text-sage-400 bg-transparent hover:border-sage-400 hover:text-sage-200 focus:outline-none focus:ring-1 focus:ring-sage-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                {status === 'submitting' ? 'Sending…' : <><Send size={14} aria-hidden />Send</>}
              </button>
            </form>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-6 md:pt-8 border-t border-sage-800 text-sage-600 text-xs grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-0 items-center">
          <span className="text-left">© {new Date().getFullYear()} Style Forage. All rights reserved.</span>
          <a href="/sitemap.xml" className="hover:text-sage-400 transition-colors text-center order-last md:order-none">Sitemap</a>
          <a href="https://thefaintsignal.com/" target="_blank" rel="noopener noreferrer" className="hover:text-sage-400 transition-colors text-right">Made with ❤️ & 🤖 by The Faint Signal</a>
        </div>
      </div>
    </footer>
  );
};
