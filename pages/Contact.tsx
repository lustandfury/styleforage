import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Instagram, Send } from 'lucide-react';
import { FadeInOnScroll } from '../components/FadeInOnScroll';
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
      </Helmet>

      <section className="py-20 md:py-32 bg-stone-50">
        <FadeInOnScroll>
          <div className="container mx-auto px-4 max-w-2xl">
            <h1 className="font-serif text-3xl md:text-5xl text-stone-900 mb-4 md:mb-6">
              Get in Touch
            </h1>
            <div className="h-1.5 w-24 bg-sage-500 rounded-full mb-6 md:mb-8" />
            <p className="text-stone-600 text-base md:text-lg leading-relaxed mb-10 md:mb-12">
              Have a question or ready to book? Send a message below, or reach out on Instagram. I’d love to hear from you.
            </p>

            <form
              name={FORM_NAME}
              method="post"
              data-netlify="true"
              data-netlify-honeypot="bot-field"
              onSubmit={handleSubmit}
              className="mb-10 md:mb-12 p-6 md:p-8 rounded-2xl bg-white border border-stone-100 shadow-sm"
            >
              <input type="hidden" name="form-name" value={FORM_NAME} />
              <p className="sr-only">
                <label htmlFor="contact-bot">Don't fill this out</label>
                <input id="contact-bot" name="bot-field" type="text" tabIndex={-1} autoComplete="off" />
              </p>
              <div className="space-y-5">
                <div>
                  <label htmlFor="contact-name" className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">
                    Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full h-11 px-4 rounded-lg border border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">
                    Email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full h-11 px-4 rounded-lg border border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="contact-phone" className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">
                    Phone <span className="font-normal text-stone-400">(optional)</span>
                  </label>
                  <input
                    id="contact-phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full h-11 px-4 rounded-lg border border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent"
                    placeholder="(555) 000-0000"
                  />
                </div>
                <div>
                  <label htmlFor="contact-message" className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent resize-y min-h-[120px]"
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
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="mt-6 w-full sm:w-auto rounded-full"
                disabled={status === 'submitting'}
              >
                {status === 'submitting' ? 'Sending…' : <><Send size={18} className="mr-2 inline" aria-hidden />Send message</>}
              </Button>
            </form>

            <div className="space-y-6 md:space-y-8">

              <a
                href="https://instagram.com/styleforage"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 md:p-6 rounded-2xl bg-white border border-stone-100 shadow-sm hover:shadow-md hover:border-sage-200 transition-all group"
                aria-label="Follow @styleforage on Instagram"
              >
                <span className="order-first flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sage-100 text-sage-700 group-hover:bg-sage-200 transition-colors">
                  <Instagram size={24} aria-hidden />
                </span>
                <div>
                  <span className="block font-medium text-stone-900 mb-0.5">Instagram</span>
                  <span className="text-stone-600 text-sm md:text-base">@styleforage</span>
                </div>
              </a>
            </div>
          </div>
        </FadeInOnScroll>
      </section>
    </div>
  );
};
