import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';
import { BookingWizard } from '../components/BookingWizard';
import { ArrowLeft } from 'lucide-react';
import { SERVICES } from '../data/services';

const SERVICES_BY_ID: Record<string, typeof SERVICES[number]> = Object.fromEntries(SERVICES.map((s) => [s.id, s]));

export const BookingPage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const service = serviceId ? SERVICES_BY_ID[serviceId] : undefined;
  const serviceTitle = service?.title || 'Book a Session';
  const pageTitle = `${serviceTitle} | Book Now | Style Forage`;
  const pageDescription = service?.description || `Book your ${serviceTitle} session with Style Forage. Personal styling services in Toronto.`;
  const pageUrl = service ? `https://styleforage.com/book/${service.id}` : 'https://styleforage.com/';
  const pageImage = service?.image ? `https://styleforage.com${service.image}` : 'https://styleforage.com/images/meta-image.webp';

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={pageImage} />
        <meta property="twitter:url" content={pageUrl} />
        <meta property="twitter:title" content={pageTitle} />
        <meta property="twitter:description" content={pageDescription} />
        <meta property="twitter:image" content={pageImage} />
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