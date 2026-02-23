import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { FadeInOnScroll } from '../FadeInOnScroll';
import { Testimonials } from './Testimonials';
import { SERVICES } from '../../data/services';

export const Services: React.FC = () => {
  const navigate = useNavigate();

  const handleBookService = (serviceId: string) => {
    navigate(`/book/${serviceId}`);
  };

  return (
    <section id="services" className="bg-sand-50 py-20 md:py-32 scroll-mt-20 border-t border-stone-100">
      <FadeInOnScroll>
      <div className="container mx-auto px-4">
        <div className="mb-12 md:mb-20">
          {/* Editorial section label */}
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <span className="font-sans text-xs text-stone-400 uppercase tracking-[0.3em]">03</span>
            <div className="h-px w-8 bg-stone-300" />
            <span className="font-sans text-xs text-stone-400 uppercase tracking-[0.3em]">Services</span>
          </div>
          <div className="md:flex md:items-end md:justify-between gap-8">
            <h2 className="font-serif font-bold text-3xl md:text-5xl text-stone-900 mb-4 md:mb-0" style={{ fontWeight: 700 }}>Curated Styling Services</h2>
            <p className="text-stone-500 text-sm md:text-base max-w-sm leading-relaxed">
              Don't see what you're looking for? <a href="/contact" className="text-sage-500 hover:text-sage-700 transition-colors underline underline-offset-2">Contact me</a> to discuss your needs.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-6xl mx-auto">
          {SERVICES.map((service) => {
            const isHorizontal = service.id === 'style-upgrade' || service.id === 'corporate-workshops';
            return (
              <article
                id={`service-${service.id}`}
                key={service.id}
                role="button"
                tabIndex={0}
                onClick={() => handleBookService(service.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleBookService(service.id); } }}
                className={`group bg-white overflow-hidden transition-all duration-500 border border-stone-100 hover:border-stone-300 hover:shadow-lg text-left cursor-pointer ${isHorizontal ? 'md:col-span-2 flex flex-col md:flex-row' : 'flex flex-col'}`}
                aria-label={`View details for ${service.title}`}
              >
                <div className={`overflow-hidden bg-stone-100 relative flex-shrink-0 ${isHorizontal ? 'aspect-[4/3] md:aspect-auto md:w-2/5 md:self-stretch' : 'aspect-[4/3]'}`}>
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="p-6 md:p-8 flex flex-col flex-grow min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {service.badge && (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-sans uppercase tracking-[0.15em] bg-sage-50 text-sage-700 border border-sage-200">
                        {service.badge}
                      </span>
                    )}
                    {service.combo && (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-sans uppercase tracking-[0.1em] bg-stone-50 text-stone-400 border border-stone-200">
                        {service.combo}
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif font-bold text-xl md:text-2xl text-stone-900 mb-3 md:mb-4 group-hover:text-sage-700 transition-colors" style={{ fontWeight: 700 }}>{service.title}</h3>
                  <p className="text-stone-500 text-sm md:text-base mb-4 leading-relaxed">{service.description}</p>
                  {service.features && service.features.length > 0 && (
                    <div className="mb-4 md:mb-6">
                      <span className="text-xs font-bold text-stone-400 uppercase tracking-widest block mb-2">What's included</span>
                      <ul className="space-y-1.5">
                        {service.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start text-sm text-stone-600">
                            <Check size={14} className="mr-2 text-sage-500 flex-shrink-0 mt-0.5" aria-hidden />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="pt-6 border-t border-stone-100 flex items-end justify-between mb-6 mt-auto">
                    {service.footnote ? (
                      <p className="text-xs text-stone-400 italic max-w-[160px] leading-snug">{service.footnote}</p>
                    ) : (
                      <div />
                    )}
                    {service.id === 'corporate-workshops' ? (
                      <span className="font-serif font-bold text-xl md:text-2xl text-stone-900">Custom</span>
                    ) : service.priceVariants ? (
                      <div className="text-right min-w-[131px]">
                        <div className="font-serif font-bold text-xl md:text-2xl text-stone-900">${service.priceVariants.online} <span className="font-sans font-normal text-xs text-stone-400 tracking-wide">online</span></div>
                        <div className="font-serif font-bold text-xl md:text-2xl text-stone-900">${service.priceVariants.inPerson} <span className="font-sans font-normal text-xs text-stone-400 tracking-wide">in-person</span></div>
                      </div>
                    ) : (
                      <div className="text-right min-w-[131px]">
                        <div className="font-serif font-bold text-xl md:text-2xl text-stone-900">${service.price}{service.priceLabel && <span className="font-sans font-normal text-xs text-stone-400 tracking-wide"> {service.priceLabel}</span>}</div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-stone-400 group-hover:text-stone-900 transition-colors duration-300 font-sans text-xs uppercase tracking-[0.15em]">
                    <span>View Service Details</span>
                    <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden>→</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <Testimonials />
      </div>
      </FadeInOnScroll>
    </section>
  );
};
