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
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{serviceTitle} | Book Now | Style Forage</title>
        <meta name="description" content={`Book your ${serviceTitle} session with Style Forage. Personal styling services in Toronto.`} />
      </Helmet>
      {/* Funnel Header */}
      <div className="bg-stone-50 border-b border-stone-100 py-6">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center text-stone-500 hover:text-stone-900 transition-colors font-medium text-sm group">
            <ArrowLeft size={18} className="mr-2 transition-transform group-hover:-translate-x-1" />
            Back to Home
          </Link>
          <div className="text-stone-300 font-serif italic hidden md:block">Step into your best style...</div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {/* The wizard will start at the 'date' step since service is pre-selected via ID */}
        <BookingWizard initialServiceId={serviceId} />
      </div>
    </div>
  );
};