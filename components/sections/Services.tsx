import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FadeInOnScroll } from '../FadeInOnScroll';
import { EditorialSectionHeader } from '../EditorialSectionHeader';
import { ServiceCard } from '../ServiceCard';
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
        <EditorialSectionHeader
          number="03"
          label="Services"
          heading="Curated Styling Services"
          description={<>Don't see what you're looking for? <a href="/contact" className="text-sage-500 hover:text-sage-700 transition-colors underline underline-offset-2">Contact me</a> to discuss your needs.</>}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {SERVICES.map((service) => {
            const wide = service.id === 'corporate-workshops';
            return (
              <ServiceCard
                key={service.id}
                service={service}
                wide={wide}
                onBook={handleBookService}
              />
            );
          })}
        </div>

        <Testimonials />
      </div>
      </FadeInOnScroll>
    </section>
  );
};
