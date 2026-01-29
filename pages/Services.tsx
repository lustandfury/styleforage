import React from 'react';
import { BookingWizard } from '../components/BookingWizard';

export const Services: React.FC = () => {
  return (
    <div className="bg-stone-50/50 min-h-screen">
       {/* Services / Booking Section Wrapper */}
       <BookingWizard />
    </div>
  );
};