import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Instagram, Send } from 'lucide-react';
import { FadeInOnScroll } from '../components/FadeInOnScroll';
import { EditorialSectionHeader } from '../components/EditorialSectionHeader';
import { Button } from '../components/ui/Button';

const FORM_NAME = 'contact';

export const Contact: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      const payload = new URLSearchParams({
        'form-name': FORM_NAME,
        ...formData,
      }).toString();
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: payload,
      });
      if (res.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', phone: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="animate-fade-in">
      <Helmet>
        <title>Contact | Style Forage</title>
        <meta name="description" content="Get in touch with Style Forage. Personal styling and wardrobe consultation in Toronto." />
        <link rel="canonical" href="https://styleforage.com/contact" />
        <meta property="og:url" content="https://styleforage.com/contact" />
        <meta property="og:title" content="Contact | Style Forage" />
        <meta property="og:description" content="Get in touch with Style Forage. Personal styling and wardrobe consultation in Toronto." />
        <meta property="og:image" content="https://styleforage.com/images/meta-image.webp" />
        <meta property="twitter:url" content="https://styleforage.com/contact" />
        <meta property="twitter:title" content="Contact | Style Forage" />
        <meta property="twitter:description" content="Get in touch with Style Forage. Personal styling and wardrobe consultation in Toronto." />
        <meta property="twitter:image" content="https://styleforage.com/images/meta-image.webp" />
      </Helmet>

      <section className="bg-sand-50 py-20 md:py-32 border-t border-stone-100">
        <FadeInOnScroll>
          <div className="container mx-auto px-4">
            <EditorialSectionHeader
              number="05"
              label="Contact"
              heading="Get in Touch"
              description="Have a question or ready to book? Send a message below or reach out on Instagram."
              level="h1"
            />

            <div className="grid md:grid-cols-3 gap-6 md:gap-8 items-start">

              {/* Left column — info + social */}
              <div className="flex flex-col gap-6">
                <a
                  href="https://instagram.com/styleforage"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 p-6 rounded-sm bg-white border border-stone-100 hover:border-stone-300 hover:shadow-lg transition-all"
                  aria-label="Follow @styleforage on Instagram"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-stone-200 group-hover:border-sage-400 transition-colors text-stone-500 group-hover:text-sage-600">
                    <Instagram size={20} aria-hidden />
                  </span>
                  <div>
                    <span className="block text-xs font-sans uppercase tracking-[0.15em] text-stone-400 mb-0.5">Instagram</span>
                    <span className="font-serif text-stone-900 text-base">@styleforage</span>
                  </div>
                  <span className="ml-auto text-stone-300 group-hover:text-stone-900 transition-colors group-hover:translate-x-1 transition-transform duration-300" aria-hidden>→</span>
                </a>

                <div className="p-6 rounded-sm bg-white border border-stone-100">
                  <span className="block text-xs font-sans uppercase tracking-[0.15em] text-stone-400 mb-3">Based in</span>
                  <p className="font-serif text-stone-900 text-base">Toronto, CA</p>
                  <div className="mt-4 pt-4 border-t border-stone-100">
                    <span className="block text-xs font-sans uppercase tracking-[0.15em] text-stone-400 mb-3">Services</span>
                    <p className="text-stone-500 text-sm leading-relaxed">Available online and in-person throughout the GTA.</p>
                  </div>
                </div>
              </div>

              {/* Right column — form */}
              <div className="md:col-span-2">
                <form
                  name={FORM_NAME}
                  method="post"
                  data-netlify="true"
                  data-netlify-honeypot="bot-field"
                  onSubmit={handleSubmit}
                  className="p-6 md:p-10 rounded-sm bg-white border border-stone-100 shadow-sm"
                >
                  <input type="hidden" name="form-name" value={FORM_NAME} />
                  <p className="sr-only">
                    <label htmlFor="contact-bot">Don't fill this out</label>
                    <input id="contact-bot" name="bot-field" type="text" tabIndex={-1} autoComplete="off" />
                  </p>

                  <div className="space-y-5">
                    <div>
                      <label htmlFor="contact-name" className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">
                        Name
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-stone-50 text-stone-900 border-2 border-stone-50 rounded-sm focus:bg-white focus:ring-2 focus:ring-sage-500 focus:border-sage-500 focus:outline-none transition-all placeholder:text-stone-300"
                        placeholder="Your name"
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="contact-email" className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">
                          Email
                        </label>
                        <input
                          id="contact-email"
                          type="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-stone-50 text-stone-900 border-2 border-stone-50 rounded-sm focus:bg-white focus:ring-2 focus:ring-sage-500 focus:border-sage-500 focus:outline-none transition-all placeholder:text-stone-300"
                          placeholder="you@example.com"
                        />
                      </div>
                      <div>
                        <label htmlFor="contact-phone" className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">
                          Phone <span className="font-normal text-stone-300">(optional)</span>
                        </label>
                        <input
                          id="contact-phone"
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-stone-50 text-stone-900 border-2 border-stone-50 rounded-sm focus:bg-white focus:ring-2 focus:ring-sage-500 focus:border-sage-500 focus:outline-none transition-all placeholder:text-stone-300"
                          placeholder="(555) 000-0000"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="contact-message" className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">
                        Message
                      </label>
                      <textarea
                        id="contact-message"
                        name="message"
                        required
                        rows={5}
                        value={formData.message}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-stone-50 text-stone-900 border-2 border-stone-50 rounded-sm focus:bg-white focus:ring-2 focus:ring-sage-500 focus:border-sage-500 focus:outline-none transition-all placeholder:text-stone-300 resize-none"
                        placeholder="How can I help?"
                      />
                    </div>
                  </div>

                  {status === 'success' && (
                    <p className="mt-4 text-sm font-medium text-sage-700" role="status">
                      Thanks! Your message has been sent. I'll get back to you soon.
                    </p>
                  )}
                  {status === 'error' && (
                    <p className="mt-4 text-sm font-medium text-red-600" role="alert">
                      Something went wrong. Please try again.
                    </p>
                  )}

                  <div className="pt-6 border-t border-stone-100 mt-6 flex items-center justify-between">
                    <span className="text-xs text-stone-400 font-sans uppercase tracking-[0.15em]">Toronto, CA</span>
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="rounded-full"
                      disabled={status === 'submitting'}
                    >
                      {status === 'submitting' ? 'Sending…' : <><Send size={16} className="mr-2 inline" aria-hidden />Send message</>}
                    </Button>
                  </div>
                </form>
              </div>

            </div>
          </div>
        </FadeInOnScroll>
      </section>
    </div>
  );
};
