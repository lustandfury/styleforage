import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { BookingWizard } from '../components/BookingWizard';
import { ArrowLeft } from 'lucide-react';

export const BookingPage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();

  return (
    <div className="min-h-screen bg-white">
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