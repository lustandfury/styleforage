import React from 'react';
import { Check } from 'lucide-react';
import type { Service } from '../types';

interface Props {
  service: Service;
  /** When true the card spans 2 columns in the parent grid */
  wide?: boolean;
  onBook: (id: string) => void;
}

export const ServiceCard: React.FC<Props> = ({ service, wide = false, onBook }) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onBook(service.id);
    }
  };

  return (
    <article
      id={`service-${service.id}`}
      role="button"
      tabIndex={0}
      onClick={() => onBook(service.id)}
      onKeyDown={handleKeyDown}
      className={`group bg-white overflow-hidden rounded-sm transition-all duration-500 border border-stone-100 hover:border-stone-300 hover:shadow-lg text-left cursor-pointer ${
        wide ? 'md:col-span-3 flex flex-col md:flex-row md:min-h-[380px]' : 'flex flex-col'
      }`}
      aria-label={`View details for ${service.title}`}
    >
      {/* Image */}
      <div className={`overflow-hidden bg-stone-100 relative flex-shrink-0 ${
        wide ? 'h-72 md:h-auto md:self-stretch md:w-2/5' : 'h-64 md:h-80'
      }`}>
        <img
          src={service.image}
          alt={service.title}
          className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      {/* Content */}
      <div className="p-6 md:p-8 flex flex-col flex-grow min-w-0">
        {/* Title */}
        <h3
          className="font-serif font-bold text-xl md:text-2xl text-stone-900 mb-3 md:mb-4 group-hover:text-sage-700 transition-colors"
          style={{ fontWeight: 700 }}
        >
          {service.title}
        </h3>

        {/* Badges */}
        {(service.badge || service.combo) && (
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
        )}

        {/* Description */}
        <p className={`text-stone-500 text-sm md:text-base mb-4 leading-relaxed ${wide ? 'line-clamp-3' : ''}`}>{service.description}</p>

        {/* Features */}
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

        {/* Price row */}
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
              <div className="font-serif font-bold text-xl md:text-2xl text-stone-900">
                ${service.priceVariants.online}{' '}
                <span className="font-sans font-normal text-xs text-stone-400 tracking-wide">online</span>
              </div>
              <div className="font-serif font-bold text-xl md:text-2xl text-stone-900">
                ${service.priceVariants.inPerson}{' '}
                <span className="font-sans font-normal text-xs text-stone-400 tracking-wide">in-person</span>
              </div>
            </div>
          ) : (
            <div className="text-right min-w-[131px]">
              <div className="font-serif font-bold text-xl md:text-2xl text-stone-900">
                ${service.price}
                {service.priceLabel && (
                  <span className="font-sans font-normal text-xs text-stone-400 tracking-wide"> {service.priceLabel}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-2 text-stone-400 group-hover:text-stone-900 transition-colors duration-300 font-sans text-xs uppercase tracking-[0.15em]">
          <span>View Service Details</span>
          <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden>→</span>
        </div>
      </div>
    </article>
  );
};
