
import { Service, BookingState, TimeSlot } from '../types';
import { Button } from './ui/Button';
import { StripePaymentForm } from './StripePaymentForm';
import React, { useState, useEffect } from 'react';
import { format, addDays, isSameDay, getDay } from 'date-fns';
import { Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Clock } from 'lucide-react';

const SERVICES: Service[] = [
  {
    id: 'closet-edit',
    title: 'The Closet Edit',
    description: 'A thoughtful review of your clothes, focused on fit, comfort, and relevance.',
    longDescription: "You don’t need to overhaul your entire wardrobe—you need a fresh perspective on the one you already have. A Closet Edit is a thoughtful review of your clothes, focused on fit, comfort, and relevance. We edit out pieces that no longer work, create new outfits from what you already own, and pinpoint the missing pieces that will help your wardrobe feel complete and modern.",
    features: [
      "Review of fit, comfort, and current style",
      "Editing items that no longer work",
      "Creating new outfits from existing pieces",
      "Pinpointing wardrobe gaps",
      "Fresh perspective on your style"
    ],
    price: 250,
    durationMin: 150,
    image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'full-style-reset',
    title: 'The Full Style Reset Package',
    description: 'For clients ready for a meaningful refresh and a wardrobe that feels aligned.',
    longDescription: "Combines The Closet Edit and Personal Shop. This is for clients ready for a meaningful refresh and a wardrobe that feels aligned, confident, and wearable. We start by clearing the noise and finish by intentionally filling the gaps.",
    features: [
      "Full Closet Edit session",
      "Personal Shopping session (In-person or Online)",
      "Style integration",
      "Complete wardrobe alignment",
      "Confidence building"
    ],
    price: 600,
    durationMin: 300,
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'personal-shop',
    title: 'Personal Shop',
    description: 'Intentional shopping, guided by fit, comfort, and what’s current.',
    longDescription: "Intentional shopping, guided by fit, comfort, and what’s current. Available as an In-person shop or Online shop. Best paired with a Closet Edit.",
    features: [
      "Guided by fit and comfort",
      "Focus on current styles",
      "In-person or Online options",
      "Targeted shopping list",
      "Budget management"
    ],
    price: 350,
    durationMin: 180,
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'style-refresh',
    title: 'Style Refresh',
    description: 'A focused update for a season, event, trip, or life change.',
    longDescription: "A focused update for a season, event, trip, or life change. Ideal if you want a vacation wardrobe, a seasonal update, or a workwear refresh.",
    features: [
      "Vacation wardrobe curation",
      "Seasonal updates",
      "Workwear refresh",
      "Event specific styling",
      "Targeted focus"
    ],
    price: 300,
    durationMin: 120,
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'corporate-workshops',
    title: 'Corporate Style Workshops',
    description: 'Practical style talks for teams to show up with confidence and consistency.',
    longDescription: "I offer style talks for teams who want to show up with confidence and consistency—individually and as a brand. Talks are practical, inclusive, and tailored to your organization.",
    features: [
      "Tailored to your organization",
      "Inclusive & practical advice",
      "Focus on professional image",
      "Amplifying brand presence",
      "Interactive Q&A"
    ],
    price: 500,
    durationMin: 60,
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80'
  }
];

const TIME_SLOTS: TimeSlot[] = [
  { time: '8:00AM', available: true },
  { time: '9:00AM', available: true },
  { time: '10:00AM', available: false },
  { time: '11:00AM', available: true },
  { time: 'Noon', available: true },
  { time: '1:00PM', available: true },
  { time: '2:00PM', available: true },
  { time: '3:00PM', available: false },
  { time: '4:00PM', available: true },
  { time: '5:00PM', available: false },
  { time: '6:00PM', available: true },
];

interface BookingWizardProps {
  initialServiceId?: string;
}

export const BookingWizard: React.FC<BookingWizardProps> = ({ initialServiceId }) => {
  const [state, setState] = useState<BookingState>({
    step: initialServiceId ? 'date' : 'service',
    selectedService: initialServiceId ? SERVICES.find(s => s.id === initialServiceId) || null : null,
    selectedDate: null,
    selectedTimes: [],
    customerDetails: { name: '', email: '', phone: '', notes: '' }
  });

  // Helper function to replace startOfToday()
  const getTodayAtMidnight = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const today = getTodayAtMidnight();
  const [visibleStartDate, setVisibleStartDate] = useState(today);
  const [serviceCardExpanded, setServiceCardExpanded] = useState(false);

  // Handle step sync if prop changes
  useEffect(() => {
    if (initialServiceId) {
      const service = SERVICES.find(s => s.id === initialServiceId);
      if (service) {
        setState(s => ({ ...s, step: 'date', selectedService: service }));
      }
    }
  }, [initialServiceId]);

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [state.step]);

  const renderServices = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
      {SERVICES.map((service) => (
        <button 
          key={service.id}
          type="button"
          className="group bg-white rounded-2xl md:rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 border border-stone-100 shadow-sm hover:shadow-xl text-left focus:outline-none focus:ring-2 focus:ring-sage-500 focus:ring-offset-2 touch-manipulation active:scale-[0.99]"
          onClick={() => setState(s => ({ ...s, selectedService: service, step: 'date' }))}
          aria-label={`Select ${service.title} service`}
        >
          <div className="aspect-[4/3] overflow-hidden">
              <img src={service.image} alt={service.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" loading="lazy" />
          </div>
          <div className="p-5 sm:p-6 md:p-8">
              <h4 className="font-serif font-bold text-lg sm:text-xl text-stone-900 mb-3 md:mb-4">{service.title}</h4>
              <p className="text-stone-500 text-sm mb-4 md:mb-6 line-clamp-2">{service.description}</p>
              <span className="block w-full py-3 px-4 sm:px-6 min-h-[48px] flex items-center justify-center bg-stone-900 text-white text-center rounded-full font-medium group-hover:bg-stone-800 transition-colors text-sm sm:text-base">Select Service</span>
          </div>
        </button>
      ))}
    </div>
  );

  const renderCalendar = () => {
    // Generate 14 days starting from visibleStartDate for horizontal date picker
    const visibleDays = Array.from({ length: 14 }, (_, i) => addDays(visibleStartDate, i));
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    
    // Check if we can go back (not before today)
    const canGoBack = visibleStartDate > today;
    
    const goToPreviousWeek = () => {
      const newStart = addDays(visibleStartDate, -7);
      // Don't go before today
      setVisibleStartDate(newStart < today ? today : newStart);
    };
    
    const goToNextWeek = () => {
      setVisibleStartDate(addDays(visibleStartDate, 7));
    };

    return (
        <div className="animate-fade-in max-w-5xl mx-auto w-full min-w-0 py-4 sm:py-6 md:py-12 px-0">
             <div className="grid lg:grid-cols-12 gap-4 sm:gap-6 md:gap-8 min-w-0">
                {/* Service Summary — on top on mobile (horizontal strip), left column on desktop */}
                <div className="order-1 lg:col-span-5 space-y-4 md:space-y-6 min-w-0 w-full">
                  <div className="bg-stone-50 rounded-2xl md:rounded-3xl border border-stone-100 shadow-sm overflow-hidden min-w-0 w-full">
                    {/* Mobile: horizontal strip + expandable full details */}
                    <div className="lg:hidden">
                      <div className="flex flex-row gap-3 p-3 items-center min-w-0">
                        {state.selectedService?.image && (
                          <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-stone-200">
                            <img src={state.selectedService.image} alt="" className="w-full h-full object-cover" loading="lazy" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                          <span className="text-sage-600 font-bold uppercase tracking-widest text-[10px] sm:text-xs">Your Selection</span>
                          <h3 className="font-serif text-sm sm:text-base font-semibold text-stone-900 leading-tight line-clamp-2 break-words">{state.selectedService?.title}</h3>
                          <div className="flex items-center justify-between gap-2 mt-1">
                            <span className="text-stone-500 text-xs flex items-center">
                              <Clock size={12} className="mr-1" />
                              {state.selectedService ? state.selectedService.durationMin / 60 : 0}h
                            </span>
                            <span className="font-serif font-bold text-stone-900 text-base sm:text-lg">
                              {state.selectedService?.id === 'corporate-workshops' ? 'Custom' : `$${state.selectedService?.price}`}
                            </span>
                          </div>
                          {!serviceCardExpanded && (
                            <p className="text-stone-600 text-xs leading-relaxed mt-1.5 line-clamp-2 break-words min-w-0">
                              {state.selectedService?.longDescription}
                            </p>
                          )}
                          <button
                            type="button"
                            onClick={() => setServiceCardExpanded(s => !s)}
                            className="flex items-center gap-1 text-sage-600 hover:text-sage-700 text-xs font-medium mt-2 touch-manipulation w-fit"
                            aria-expanded={serviceCardExpanded}
                          >
                            {serviceCardExpanded ? (
                              <>Show less <ChevronUp size={14} aria-hidden /></>
                            ) : (
                              <>Read full details <ChevronDown size={14} aria-hidden /></>
                            )}
                          </button>
                          {serviceCardExpanded && (
                            <div className="mt-3 pt-3 border-t border-stone-200 space-y-3">
                              <p className="text-stone-600 text-xs leading-relaxed break-words min-w-0">
                                {state.selectedService?.longDescription}
                              </p>
                              {state.selectedService?.features && state.selectedService.features.length > 0 && (
                                <div>
                                  <span className="text-stone-800 font-bold uppercase tracking-widest text-[10px] block mb-1.5">What's Included</span>
                                  <ul className="space-y-1">
                                    {state.selectedService.features.map((feature, idx) => (
                                      <li key={idx} className="flex items-start text-xs text-stone-600 break-words min-w-0">
                                        <Check size={12} className="mr-1.5 text-sage-500 flex-shrink-0 mt-0.5" />
                                        <span className="min-w-0">{feature}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                          <Button variant="outline" size="sm" className="mt-3 w-full sm:w-auto min-h-[40px] touch-manipulation text-xs" onClick={() => window.history.back()}>Change Service</Button>
                        </div>
                      </div>
                    </div>
                    {/* Desktop: full card */}
                    <div className="hidden lg:block">
                      {state.selectedService?.image && (
                        <div className="aspect-[16/9] overflow-hidden">
                          <img src={state.selectedService.image} alt={state.selectedService.title} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                      )}
                      <div className="p-4 sm:p-5 md:p-6 min-w-0">
                        <span className="text-sage-600 font-bold uppercase tracking-widest text-xs block mb-2 md:mb-3">Your Selection</span>
                        <h3 className="font-serif text-lg sm:text-xl text-stone-900 mb-2 md:mb-3 break-words min-w-0">{state.selectedService?.title}</h3>
                        <div className="flex items-center justify-between mb-3 md:mb-4 pb-3 md:pb-4 border-b border-stone-200">
                          <div className="flex items-center text-stone-500 text-sm">
                            <Clock size={14} className="mr-1.5" />
                            {state.selectedService ? state.selectedService.durationMin / 60 : 0}h
                          </div>
                          <div className="text-lg sm:text-xl font-serif font-bold text-stone-900">
                            {state.selectedService?.id === 'corporate-workshops' ? 'Custom' : `$${state.selectedService?.price}`}
                          </div>
                        </div>
                        <p className="text-stone-600 text-sm leading-relaxed mb-3 md:mb-4 break-words min-w-0 overflow-hidden">
                          {state.selectedService?.longDescription}
                        </p>
                        {state.selectedService?.features && state.selectedService.features.length > 0 && (
                          <div className="mb-3 md:mb-4">
                            <span className="text-stone-800 font-bold uppercase tracking-widest text-xs block mb-1.5 md:mb-2">What's Included</span>
                            <ul className="space-y-1 md:space-y-1.5">
                              {state.selectedService.features.slice(0, 4).map((feature, idx) => (
                                <li key={idx} className="flex items-start text-xs sm:text-sm text-stone-600 break-words min-w-0">
                                  <Check size={14} className="mr-2 text-sage-500 flex-shrink-0 mt-0.5" />
                                  <span className="min-w-0">{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <Button variant="outline" size="sm" className="min-h-[44px] touch-manipulation w-full sm:w-auto" onClick={() => window.history.back()}>Change Service</Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Booking Card — below service on mobile, right column on desktop */}
                <div className="order-2 lg:col-span-7 min-w-0 w-full">
                  <div className="bg-white rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 border border-stone-100 shadow-sm min-w-0 w-full overflow-hidden">
                    <h3 className="font-serif text-xl sm:text-2xl text-stone-900 mb-4 md:mb-6">Book Appointment</h3>
                    
                    {/* Select Date */}
                    <div className="mb-6 md:mb-8">
                      <label className="text-xs font-bold text-stone-400 uppercase tracking-widest block mb-3 md:mb-4">Select Date</label>
                      
                      <div className="flex flex-nowrap items-center gap-2 mb-3 md:mb-4">
                        <button 
                          onClick={goToPreviousWeek}
                          disabled={!canGoBack}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition-colors touch-manipulation flex-shrink-0 disabled:pointer-events-none disabled:opacity-50 bg-stone-100 active:bg-stone-200"
                          aria-label="Previous month"
                        >
                          <ChevronLeft size={22} className={canGoBack ? 'text-stone-600' : 'text-stone-300'} aria-hidden="true" />
                        </button>
                        <h4 className="font-serif text-base sm:text-lg text-stone-900 flex-1 text-center min-w-0 truncate px-1" id="calendar-month-label">
                          {format(state.selectedDate || visibleStartDate, 'MMMM yyyy')}
                        </h4>
                        <button 
                          onClick={goToNextWeek}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-stone-100 active:bg-stone-200 transition-colors text-stone-600 touch-manipulation flex-shrink-0 bg-stone-100"
                          aria-label="Next month"
                        >
                          <ChevronRight size={22} aria-hidden="true" />
                        </button>
                      </div>

                      {/* Horizontal Day Picker — scrolls inside container, no page overflow */}
                      <div className="w-full min-w-0 overflow-hidden">
                        <div className="flex gap-2 overflow-x-auto overflow-y-hidden pb-2 scrollbar-hide scroll-smooth -mx-1 px-1 sm:mx-0 sm:px-0">
                        {visibleDays.map((day) => {
                          const isSelected = state.selectedDate && isSameDay(day, state.selectedDate);
                          const dayOfWeek = getDay(day);
                          
                          return (
                            <button
                              key={day.toString()}
                              type="button"
                              onClick={() => setState(s => ({ ...s, selectedDate: day, selectedTimes: [] }))}
                              aria-label={format(day, 'EEEE, MMMM do, yyyy')}
                              aria-pressed={isSelected}
                              className={`
                                flex-shrink-0 flex flex-col items-center justify-center min-w-[56px] w-14 h-[60px] sm:h-16 rounded-full border-2 transition-all touch-manipulation
                                ${isSelected 
                                  ? 'border-stone-900 bg-white text-stone-900' 
                                  : 'border-transparent bg-stone-50 text-stone-700 hover:bg-stone-100 active:bg-stone-100'
                                }
                              `}
                            >
                              <span className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isSelected ? 'text-stone-500' : 'text-stone-400'}`}>
                                {dayNames[dayOfWeek]}
                              </span>
                              <span className="text-base sm:text-lg font-semibold">{format(day, 'd')}</span>
                            </button>
                          );
                        })}
                        </div>
                      </div>
                    </div>

                    {/* Select Time */}
                    <div className="mb-6 md:mb-8 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-3 md:mb-4 min-w-0">
                        <label className="text-xs font-bold text-stone-400 uppercase tracking-widest break-words min-w-0">Select Available Time(s)</label>
                        <span className="text-xs text-stone-400 shrink-0">Select all times that work for you</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 sm:gap-3 min-w-0 w-full" role="group" aria-label="Available time slots">
                        {TIME_SLOTS.map((slot) => {
                          const isSelected = state.selectedTimes.includes(slot.time);
                          const isDisabled = !slot.available;
                          
                          // Toggle time selection
                          const handleTimeClick = () => {
                            if (isDisabled) return;
                            setState(s => ({
                              ...s,
                              selectedTimes: isSelected
                                ? s.selectedTimes.filter(t => t !== slot.time)
                                : [...s.selectedTimes, slot.time]
                            }));
                          };
                          
                          return (
                            <button
                              key={slot.time}
                              type="button"
                              disabled={isDisabled}
                              onClick={handleTimeClick}
                              aria-label={`${isSelected ? 'Deselect' : 'Select'} ${slot.time}${isDisabled ? ' (unavailable)' : ''}`}
                              aria-pressed={isSelected}
                              className={`
                                min-h-[44px] py-3 px-3 sm:px-4 rounded-full text-sm font-medium border-2 transition-all touch-manipulation
                                ${isSelected 
                                  ? 'border-stone-900 bg-white text-stone-900' 
                                  : isDisabled
                                    ? 'border-transparent bg-stone-50 text-stone-300 line-through cursor-not-allowed'
                                    : 'border-transparent bg-stone-50 text-stone-700 hover:bg-stone-100 active:bg-stone-100'
                                }
                              `}
                            >
                              {slot.time}
                            </button>
                          );
                        })}
                      </div>
                      
                      {state.selectedTimes.length > 0 && (
                        <p className="mt-3 text-sm text-stone-500">
                          {state.selectedTimes.length} time{state.selectedTimes.length > 1 ? 's' : ''} selected
                        </p>
                      )}
                    </div>

                    {/* Book Button — full width, touch-friendly */}
                    <Button 
                      size="lg"
                      className="w-full rounded-full py-4 min-h-[48px] touch-manipulation"
                      disabled={!state.selectedDate || state.selectedTimes.length === 0}
                      onClick={() => setState(s => ({ ...s, step: 'details' }))}
                    >
                      Book Appointment
                    </Button>
                  </div>
                </div>
             </div>
        </div>
    );
  };

  const renderDetails = () => (
    <div className="animate-fade-in max-w-2xl mx-auto py-8 sm:py-12 md:py-20 px-1">
         <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-serif text-stone-900 mb-3 md:mb-4">Finalizing Your Details</h3>
            <p className="text-stone-500 text-sm sm:text-base px-2">Tell me a bit about yourself so we can make the most of our session.</p>
         </div>
         
         <div className="bg-white p-5 sm:p-8 md:p-14 rounded-2xl md:rounded-3xl border border-stone-100 shadow-xl space-y-6 md:space-y-8">
            <div className="space-y-2">
                <label htmlFor="customer-name" className="text-sm font-bold text-stone-800 uppercase tracking-widest">Full Name</label>
                <input 
                    id="customer-name"
                    type="text" 
                    required
                    aria-required="true"
                    className="w-full px-4 sm:px-6 py-3.5 sm:py-4 bg-stone-50 text-stone-900 border-2 border-stone-50 rounded-xl md:rounded-2xl focus:bg-white focus:ring-2 focus:ring-sage-500 focus:border-sage-500 focus:outline-none transition-all placeholder:text-stone-300 text-base sm:text-lg min-h-[48px]"
                    placeholder="Jane Doe"
                    value={state.customerDetails.name}
                    onChange={(e) => setState(s => ({...s, customerDetails: {...s.customerDetails, name: e.target.value}}))}
                />
            </div>
            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              <div className="space-y-2">
                  <label htmlFor="customer-email" className="text-sm font-bold text-stone-800 uppercase tracking-widest">Email</label>
                  <input 
                      id="customer-email"
                      type="email" 
                      required
                      aria-required="true"
                      className="w-full px-4 sm:px-6 py-3.5 sm:py-4 bg-stone-50 text-stone-900 border-2 border-stone-50 rounded-xl md:rounded-2xl focus:bg-white focus:ring-2 focus:ring-sage-500 focus:border-sage-500 focus:outline-none transition-all placeholder:text-stone-300 min-h-[48px]"
                      placeholder="jane@example.com"
                      value={state.customerDetails.email}
                      onChange={(e) => setState(s => ({...s, customerDetails: {...s.customerDetails, email: e.target.value}}))}
                  />
              </div>
              <div className="space-y-2">
                  <label htmlFor="customer-phone" className="text-sm font-bold text-stone-800 uppercase tracking-widest">Phone</label>
                  <input 
                      id="customer-phone"
                      type="tel" 
                      className="w-full px-4 sm:px-6 py-3.5 sm:py-4 bg-stone-50 text-stone-900 border-2 border-stone-50 rounded-xl md:rounded-2xl focus:bg-white focus:ring-2 focus:ring-sage-500 focus:border-sage-500 focus:outline-none transition-all placeholder:text-stone-300 min-h-[48px]"
                      placeholder="(555) 000-0000"
                      value={state.customerDetails.phone}
                      onChange={(e) => setState(s => ({...s, customerDetails: {...s.customerDetails, phone: e.target.value}}))}
                  />
              </div>
            </div>
            <div className="space-y-2">
                <label htmlFor="customer-notes" className="text-sm font-bold text-stone-800 uppercase tracking-widest">Notes & Style Goals</label>
                <textarea 
                    id="customer-notes"
                    rows={4}
                    className="w-full px-4 sm:px-6 py-3.5 sm:py-4 bg-stone-50 text-stone-900 border-2 border-stone-50 rounded-xl md:rounded-2xl focus:bg-white focus:ring-2 focus:ring-sage-500 focus:border-sage-500 focus:outline-none transition-all placeholder:text-stone-300 resize-none min-h-[100px]"
                    placeholder="E.g. I need help dressing for a new career path..."
                    value={state.customerDetails.notes}
                    onChange={(e) => setState(s => ({...s, customerDetails: {...s.customerDetails, notes: e.target.value}}))}
                />
            </div>
         </div>

         <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-8 sm:mt-10 md:mt-12">
             <Button variant="ghost" className="min-h-[48px] touch-manipulation sm:min-h-0" onClick={() => setState(s => ({ ...s, step: 'date' }))}>
                <ChevronLeft size={18} className="mr-2"/> Back
             </Button>
             <Button 
                size="lg"
                className="w-full sm:w-auto px-8 sm:px-12 rounded-full min-h-[48px] touch-manipulation"
                disabled={!state.customerDetails.name || !state.customerDetails.email}
                onClick={() => setState(s => ({ ...s, step: 'payment' }))}
             >
                Continue to Payment
             </Button>
         </div>
    </div>
  );

  const renderPayment = () => (
    <div className="animate-fade-in max-w-xl mx-auto py-8 sm:py-12 md:py-20 px-1">
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-serif text-stone-900 mb-3 md:mb-4">Secure Checkout</h3>
            <p className="text-stone-500 text-sm sm:text-base">Confirm your session and complete payment.</p>
        </div>
        
        <div className="bg-stone-50 p-4 sm:p-6 md:p-8 rounded-2xl md:rounded-3xl mb-8 sm:mb-10 md:mb-12 border border-stone-100">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-stone-200">
                <div className="min-w-0">
                  <h4 className="font-serif text-lg sm:text-xl text-stone-900 mb-1">{state.selectedService?.title}</h4>
                  <div className="text-stone-500 text-sm">
                    {state.selectedDate && format(state.selectedDate, 'EEEE, MMMM do')}
                  </div>
                  <div className="text-stone-500 text-sm mt-1">
                    {state.selectedTimes.length === 1 
                      ? `@ ${state.selectedTimes[0]}`
                      : <>Available: {state.selectedTimes.join(', ')}</>
                    }
                  </div>
                </div>
                <div className="font-serif text-xl sm:text-2xl font-bold text-stone-900 flex-shrink-0">
                  ${state.selectedService?.price}
                </div>
            </div>
            <div className="flex justify-between font-bold text-base sm:text-lg text-stone-900 uppercase tracking-widest">
                <span>Total Due</span>
                <span>${state.selectedService?.price}</span>
            </div>
        </div>

        <StripePaymentForm
          amount={state.selectedService?.price || 0}
          onSuccess={async () => {
            try {
              await fetch('/api/send-booking-confirmation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  customerName: state.customerDetails.name,
                  customerEmail: state.customerDetails.email,
                  service: state.selectedService?.title,
                  date: state.selectedDate ? format(state.selectedDate, 'MMMM d, yyyy') : '',
                  times: state.selectedTimes,
                }),
              });
            } catch (e) {
              console.error('Confirmation email failed:', e);
            }
            setState(s => ({ ...s, step: 'confirmation' }));
          }}
          onError={(error) => console.error('Payment error:', error)}
          metadata={{
            service: state.selectedService?.title,
            date: state.selectedDate ? format(state.selectedDate, 'yyyy-MM-dd') : '',
            times: state.selectedTimes.join(', '),
            customerName: state.customerDetails.name,
            customerEmail: state.customerDetails.email,
          }}
        />

        <div className="mt-4 sm:mt-6">
           <Button variant="ghost" className="w-full min-h-[48px] touch-manipulation" onClick={() => setState(s => ({ ...s, step: 'details' }))}>
              Go Back
           </Button>
        </div>
    </div>
  );

  const renderConfirmation = () => (
    <div className="text-center py-12 sm:py-20 md:py-32 animate-fade-in max-w-2xl mx-auto px-4">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-sage-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-10 shadow-xl shadow-sage-500/30">
            <Check size={40} aria-hidden="true" />
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-stone-900 mb-4 sm:mb-6 tracking-tight">Booking Confirmed!</h2>
        <p className="text-stone-500 text-base sm:text-lg md:text-xl leading-relaxed mb-8 sm:mb-12 font-light px-1">
          Thank you, {state.customerDetails.name}. A confirmation email with preparation steps has been sent to <span className="text-stone-900 font-medium break-all">{state.customerDetails.email}</span>.
        </p>
        <div className="bg-stone-50 p-5 sm:p-8 md:p-10 rounded-2xl md:rounded-3xl border border-stone-100 text-left mb-8 sm:mb-12 space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 border-b border-stone-200 pb-4">
                <span className="text-stone-400 font-bold uppercase tracking-widest text-xs">Service</span>
                <span className="text-stone-900 font-bold text-sm sm:text-base">{state.selectedService?.title}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                <span className="text-stone-400 font-bold uppercase tracking-widest text-xs">
                  {state.selectedTimes.length > 1 ? 'Date & Availability' : 'Date & Time'}
                </span>
                <div className="text-right sm:text-right">
                  <span className="text-stone-900 font-bold block text-sm sm:text-base">{state.selectedDate && format(state.selectedDate, 'MMMM do')}</span>
                  {state.selectedTimes.length === 1 ? (
                    <span className="text-stone-600 text-sm block">@ {state.selectedTimes[0]}</span>
                  ) : (
                    <span className="text-stone-600 text-sm block">{state.selectedTimes.join(', ')}</span>
                  )}
                </div>
            </div>
        </div>
        <Button size="lg" className="rounded-full px-8 sm:px-12 min-h-[48px] w-full sm:w-auto max-w-xs mx-auto touch-manipulation" onClick={() => window.location.href = '/'}>Return to Home</Button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden">
        {state.step !== 'confirmation' && state.step !== 'service' && (
            <div className="flex justify-center mt-6 sm:mt-8 md:mt-12 px-2" role="progressbar" aria-valuenow={['date', 'details', 'payment'].indexOf(state.step) + 1} aria-valuemin={1} aria-valuemax={3} aria-label="Booking progress">
                <div className="flex items-center gap-3 sm:gap-4">
                    {['Date', 'Details', 'Payment'].map((stepName, idx) => {
                        const steps = ['date', 'details', 'payment'];
                        const currentIdx = steps.indexOf(state.step);
                        const isActive = idx === currentIdx;
                        const isCompleted = idx < currentIdx;

                        return (
                            <div key={stepName} className="flex items-center">
                                <div className={`
                                    w-3.5 h-3.5 sm:w-3 sm:h-3 rounded-full transition-all duration-500 flex-shrink-0
                                    ${isActive ? 'bg-sage-500 ring-4 ring-sage-500/20 scale-125' : isCompleted ? 'bg-stone-900' : 'bg-stone-200'}
                                `} aria-hidden="true" />
                                {idx < 2 && <div className={`w-6 sm:w-8 md:w-16 h-0.5 mx-1 sm:mx-2 flex-shrink-0 ${isCompleted ? 'bg-stone-900' : 'bg-stone-100'}`} aria-hidden="true" />}
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        <div className="min-h-[480px] sm:min-h-[560px] md:min-h-[600px]">
            {state.step === 'service' && renderServices()}
            {state.step === 'date' && renderCalendar()}
            {state.step === 'details' && renderDetails()}
            {state.step === 'payment' && renderPayment()}
            {state.step === 'confirmation' && renderConfirmation()}
        </div>
    </div>
  );
};
