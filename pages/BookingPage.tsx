import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';
import { BookingWizard } from '../components/BookingWizard';
import { ArrowLeft } from 'lucide-react';

// Service titles for dynamic page titles
const SERVICE_TITLES: Record<string, string> = {
  'closet-edit': 'The Closet Edit',
  'full-style-reset': 'Full Style Reset Package',
  'personal-shop': 'Personal Shop',
  'style-refresh': 'Style Refresh',
  'corporate-workshops': 'Corporate Style Workshops',
};

export const BookingPage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const serviceTitle = serviceId ? SERVICE_TITLES[serviceId] || 'Book a Session' : 'Book a Session';

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Helmet>
        <title>{serviceTitle} | Book Now | Style Forage</title>
        <meta name="description" content={`Book your ${serviceTitle} session with Style Forage. Personal styling services in Toronto.`} />
      </Helmet>
      {/* Funnel Header — touch-friendly on mobile */}
      <div className="bg-stone-50 border-b border-stone-100 py-3 md:py-6">
        <div className="container mx-auto px-4 flex items-center justify-between gap-2 min-h-[52px] md:min-h-0">
          <Link to="/" className="inline-flex items-center min-h-[44px] min-w-[44px] -ml-2 pl-2 pr-2 text-stone-500 hover:text-stone-900 transition-colors font-medium text-sm group touch-manipulation" aria-label="Back to home">
            <ArrowLeft size={20} className="mr-1.5 md:mr-2 transition-transform group-hover:-translate-x-1 flex-shrink-0" aria-hidden />
            <span className="hidden sm:inline">Back to Home</span>
          </Link>
          <Link to="/" className="font-serif text-xl sm:text-2xl font-semibold tracking-tight text-stone-900 hover:text-stone-700 transition-colors py-2 px-1 min-h-[44px] inline-flex items-center touch-manipulation">
            Style Forage
          </Link>
          <div className="text-stone-300 font-serif italic hidden md:block md:flex-1 md:text-right text-sm">Step into your best style...</div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 sm:py-6 md:py-8 w-full min-w-0 max-w-full">
        {/* The wizard will start at the 'date' step since service is pre-selected via ID */}
        <BookingWizard initialServiceId={serviceId} />
      </div>
    </div>
  );
};