import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ChevronRight, Check } from 'lucide-react';
import { FadeInOnScroll } from '../FadeInOnScroll';
import { Testimonials } from './Testimonials';
import { SERVICES } from '../../data/services';

export const Services: React.FC = () => {
  const navigate = useNavigate();

  const handleBookService = (serviceId: string) => {
    navigate(`/book/${serviceId}`);
  };

  return (
    <section id="services" className="services-quilted-bg py-20 md:py-32 scroll-mt-20">
      <FadeInOnScroll>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-20">
          <h2 className="font-serif text-3xl md:text-5xl text-stone-900 mb-4 md:mb-6">Curated Styling Services</h2>
          <div className="h-1.5 w-24 bg-sage-500 mx-auto rounded-full mb-4 md:mb-6"></div>
          <p className="text-stone-600 text-base md:text-lg max-w-xl mx-auto">
            Click <strong>View Service Details</strong> to view more details and book. <br />Don't see what you're looking for? <a href="/contact" className="text-sage-500 hover:text-sage-600 transition-colors">Contact me</a> to discuss your needs.
          </p>
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
                className={`group bg-white rounded-3xl overflow-hidden transition-all duration-500 border border-stone-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 text-left cursor-pointer ${isHorizontal ? 'md:col-span-2 flex flex-col md:flex-row' : 'flex flex-col'}`}
                aria-label={`View details for ${service.title}`}
              >
                <div className={`overflow-hidden bg-stone-100 relative flex-shrink-0 ${isHorizontal ? 'aspect-[4/3] md:aspect-auto md:w-2/5 md:self-stretch' : 'aspect-[4/3]'}`}>
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/20 transition-colors" />
                </div>
                <div className="p-6 md:p-8 flex flex-col flex-grow min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {service.badge && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-sage-100 text-sage-700">
                        {service.badge}
                      </span>
                    )}
                    {service.combo && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-500">
                        {service.combo}
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif font-bold text-xl md:text-2xl text-stone-900 mb-3 md:mb-4 group-hover:text-sage-700 transition-colors">{service.title}</h3>
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
                  <div className="pt-6 border-t border-stone-100 flex items-center justify-between mb-6 mt-auto">
                    <div className="flex items-center text-stone-400 font-medium text-sm">
                      <Clock size={16} className="mr-2" aria-hidden="true" />
                      <span>{service.durationMin / 60}h</span>
                    </div>
                    {service.id === 'corporate-workshops' ? (
                      <span className="font-serif font-bold text-xl md:text-2xl text-stone-900">Custom</span>
                    ) : service.priceVariants ? (
                      <div className="text-right">
                        <div className="font-serif font-bold text-xl md:text-2xl text-stone-900">${service.priceVariants.online} <span className="font-sans font-normal text-xs text-stone-400 tracking-wide">online</span></div>
                        <div className="font-serif font-bold text-xl md:text-2xl text-stone-900">${service.priceVariants.inPerson} <span className="font-sans font-normal text-xs text-stone-400 tracking-wide">in-person</span></div>
                      </div>
                    ) : (
                      <span className="font-serif font-bold text-xl md:text-2xl text-stone-900">${service.price}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 font-medium text-stone-500 group-hover:text-stone-900 transition-colors duration-300">
                    <span>View Service Details</span>
                    <ChevronRight size={20} className="flex-shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
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
