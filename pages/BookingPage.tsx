import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';
import { BookingWizard } from '../components/BookingWizard';
import { ArrowLeft } from 'lucide-react';
import { SERVICES } from '../data/services';

const SERVICE_TITLES: Record<string, string> = Object.fromEntries(SERVICES.map((s) => [s.id, s.title]));

export const BookingPage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const serviceTitle = serviceId ? SERVICE_TITLES[serviceId] || 'Book a Session' : 'Book a Session';

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Helmet>
        <title>{serviceTitle} | Book Now | Style Forage</title>
        <meta name="description" content={`Book your ${serviceTitle} session with Style Forage. Personal styling services in Toronto.`} />
      </Helmet>
      {/* Booking nav — back icon + name only, transparent */}
      <div className="py-2 md:py-2.5">
        <div className="container mx-auto px-4 flex items-center gap-3 min-h-[40px] md:min-h-[44px]">
          <Link to="/#services" className="inline-flex items-center justify-center min-h-[40px] min-w-[40px] -ml-1 text-stone-500 hover:text-stone-900 transition-colors group touch-manipulation cursor-pointer rounded-full hover:bg-stone-100/80" aria-label="Back to services">
            <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-0.5 flex-shrink-0" aria-hidden />
          </Link>
          <Link to="/" className="font-serif text-lg sm:text-xl font-semibold tracking-tight text-stone-900 hover:text-stone-700 transition-colors touch-manipulation cursor-pointer">
            Style Forage
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 sm:py-6 md:py-8 w-full min-w-0 max-w-full">
        {/* The wizard will start at the 'date' step since service is pre-selected via ID */}
        <BookingWizard initialServiceId={serviceId} />
      </div>
    </div>
  );
};