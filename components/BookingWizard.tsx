
import { useNavigate } from 'react-router-dom';
import { Service, ServiceVariant, BookingState, TimeSlot } from '../types';
import { Button } from './ui/Button';
import { FirstBookingSale, SALE_OFFER_LABEL } from './FirstBookingSale';
import React, { useState, useEffect, useCallback } from 'react';
import { format, addDays, isSameDay, getDay } from 'date-fns';
import { Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Clock, Wand2 } from 'lucide-react';
import { SERVICES } from '../data/services';

/** Resolve display/charge price from service and optional variant (Online vs In-person). */
function getEffectivePrice(service: Service | null, variant?: ServiceVariant): number | null {
  if (!service) return null;
  if (service.priceVariants && variant) return service.priceVariants[variant];
  return service.price;
}

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
  const navigate = useNavigate();
  const initialService = initialServiceId ? SERVICES.find(s => s.id === initialServiceId) || null : null;
  const [state, setState] = useState<BookingState>({
    step: initialServiceId ? 'date' : 'service',
    selectedService: initialService,
    selectedVariant: initialService?.priceVariants ? 'online' : undefined,
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
  const [changingService, setChangingService] = useState(false);
  const [hoveredServiceId, setHoveredServiceId] = useState<string | null>(null);
  const [saleActive, setSaleActive] = useState(false);
  const [saleCountdown, setSaleCountdown] = useState('--:--:--');

  const handleSaleStateChange = useCallback((state: { active: boolean; countdown?: string }) => {
    setSaleActive(state.active);
    if (state.countdown !== undefined) setSaleCountdown(state.countdown);
  }, []);

  // Handle step sync if prop changes
  useEffect(() => {
    if (initialServiceId) {
      const service = SERVICES.find(s => s.id === initialServiceId);
      if (service) {
        setState(s => ({
          ...s,
          step: 'date',
          selectedService: service,
          selectedVariant: service.priceVariants ? 'online' : undefined,
        }));
      }
    }
  }, [initialServiceId]);

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [state.step]);

  const renderServices = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
      {SERVICES.map((service) => {
        const isHovered = hoveredServiceId === service.id;
        return (
          <button
            key={service.id}
            type="button"
            className="w-full bg-white rounded-2xl md:rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 border border-stone-100 shadow-sm hover:shadow-xl text-left focus:outline-none focus:ring-2 focus:ring-sage-500 focus:ring-offset-2 touch-manipulation active:scale-[0.99]"
            onClick={() => setState(s => ({
              ...s,
              selectedService: service,
              selectedVariant: service.priceVariants ? 'online' : undefined,
              step: 'date'
            }))}
            onMouseEnter={() => setHoveredServiceId(service.id)}
            onMouseLeave={() => setHoveredServiceId(null)}
            onFocus={() => setHoveredServiceId(service.id)}
            onBlur={() => setHoveredServiceId(null)}
            aria-label={`Select ${service.title} — book this service`}
          >
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src={service.image}
                alt={service.title}
                className={`w-full h-full object-cover transition-transform duration-300 ${isHovered ? 'scale-110' : 'scale-100'}`}
                loading="lazy"
              />
            </div>
            <div className="p-5 sm:p-6 md:p-8">
              <h4 className="font-serif font-bold text-lg sm:text-xl text-stone-900 mb-3 md:mb-4">{service.title}</h4>
              <p className="text-stone-500 text-sm mb-4 md:mb-6 line-clamp-2">{service.description}</p>
              <span
                className={`block w-full py-2.5 px-4 sm:px-6 min-h-[44px] flex items-center justify-center rounded-full font-medium text-sm sm:text-base border-2 border-stone-900 transition-colors duration-300 ${
                  isHovered ? 'bg-stone-900 text-white' : 'bg-transparent text-stone-900'
                }`}
              >
                Book this service
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );

  const renderServicePicker = () => (
    <div className="bg-white rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 border border-stone-100 shadow-sm animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-serif text-xl sm:text-2xl text-stone-900">Choose a Service</h3>
        <Button variant="ghost" size="sm" onClick={() => setChangingService(false)}>Cancel</Button>
      </div>
      <div className="space-y-3">
        {SERVICES.map((service) => {
          const isSelected = state.selectedService?.id === service.id;
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => {
                setState(s => ({
                  ...s,
                  selectedService: service,
                  selectedVariant: service.priceVariants ? 'online' : undefined,
                }));
                setChangingService(false);
              }}
              className={`w-full flex items-center gap-4 p-3 sm:p-4 rounded-2xl text-left transition-all duration-200 cursor-pointer border-2 touch-manipulation ${
                isSelected
                  ? 'border-stone-900 bg-stone-50'
                  : 'border-stone-100 hover:border-stone-300 hover:bg-stone-50'
              }`}
              aria-pressed={isSelected}
              aria-label={`Select ${service.title}`}
            >
              <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-stone-100">
                <img src={service.image} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h4 className="font-serif font-bold text-stone-900 text-sm sm:text-base">{service.title}</h4>
                  {service.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sage-100 text-sage-700">{service.badge}</span>
                  )}
                  {isSelected && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-900 text-white">Current</span>
                  )}
                </div>
                <p className="text-stone-500 text-xs line-clamp-2 leading-relaxed">{service.description}</p>
              </div>
              <div className="text-right flex-shrink-0 pl-2">
                {service.id === 'corporate-workshops' ? (
                  <span className="font-serif font-bold text-stone-900 text-sm sm:text-base">Custom</span>
                ) : service.priceVariants ? (
                  <span className="font-serif font-bold text-stone-900 text-sm sm:text-base">From ${service.price}</span>
                ) : (
                  <span className="font-serif font-bold text-stone-900 text-sm sm:text-base">${service.price}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
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
        <div className="animate-fade-in max-w-5xl mx-auto w-full min-w-0 px-0">
             <div className="grid lg:grid-cols-12 gap-4 sm:gap-6 md:gap-8 min-w-0">
                {/* Service Summary — on top on mobile (horizontal strip), left column on desktop */}
                <div className="order-1 lg:col-span-5 space-y-4 md:space-y-6 min-w-0 w-full">
                  <div className="bg-stone-50 rounded-2xl md:rounded-3xl border border-stone-100 shadow-sm overflow-hidden min-w-0 w-full">
                    {/* Top: image left, title + selectors right */}
                    <div className="flex gap-4 p-4 md:p-5 items-start">
                      {state.selectedService?.image && (
                        <div className="flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-stone-200">
                          <img src={state.selectedService.image} alt="" className="w-full h-full object-cover" loading="lazy" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-sage-600 font-bold uppercase tracking-widest text-[10px] block mb-1">Your Selection</span>
                        <div className="flex items-baseline justify-between gap-2 min-w-0 mb-2">
                          <h3 className="font-serif text-base sm:text-lg font-semibold text-stone-900 leading-tight break-words min-w-0">{state.selectedService?.title}</h3>
                          <span className="font-serif font-bold text-stone-900 text-base sm:text-lg shrink-0">
                            {discountedPrice != null ? (
                              <>
                                <span className="text-stone-400 line-through font-normal mr-1.5">${effectivePrice}</span>
                                <span className="text-red-500 font-semibold">${discountedPrice}</span>
                              </>
                            ) : (
                              effectivePrice != null ? `$${effectivePrice}` : ''
                            )}
                          </span>
                        </div>
                        {state.selectedService?.priceVariants && (
                          <div className="flex flex-wrap gap-2" role="group" aria-label="Format">
                            {(['online', 'inPerson'] as const).map((v) => {
                              const price = state.selectedService!.priceVariants![v];
                              const label = v === 'online' ? 'Online' : 'In-person';
                              const isSelected = state.selectedVariant === v;
                              return (
                                <button
                                  key={v}
                                  type="button"
                                  onClick={() => setState(s => ({ ...s, selectedVariant: v }))}
                                  aria-pressed={isSelected}
                                  className={`inline-flex items-center gap-1.5 min-h-[34px] px-3 rounded-full text-xs font-medium border-2 transition-colors touch-manipulation cursor-pointer ${
                                    isSelected ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                                  }`}
                                >
                                  <Check
                                    size={11}
                                    strokeWidth={3}
                                    className={`flex-shrink-0 transition-all duration-200 ${isSelected ? 'opacity-100 scale-100 w-[11px]' : 'opacity-0 scale-50 w-0'}`}
                                    aria-hidden
                                  />
                                  {label} ${price}
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {saleActive && (
                          <p className="mt-2" aria-live="polite">
                            <span className="inline-flex flex-col gap-1.5 rounded-md bg-sage-100 px-3 py-1.5 font-medium text-sage-900 ring-1 ring-sage-500/40 text-[10px]">
                              <span>{SALE_OFFER_LABEL}</span>
                              <span className="flex items-center gap-1.5 shrink-0">
                                <Clock size={12} className="text-sage-600" aria-hidden />
                                <span className="font-mono tabular-nums">{saleCountdown} left</span>
                              </span>
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                    {/* Bottom: description + features full width */}
                    <div className="px-4 md:px-5 pb-4 md:pb-5 border-t border-stone-100 pt-3 space-y-2 min-w-0">
                      <p className="text-stone-600 text-xs sm:text-sm leading-relaxed break-words min-w-0">
                        {state.selectedService?.longDescription}
                      </p>
                      {state.selectedService?.variantDescriptions && state.selectedVariant && (
                        <p className="text-sage-700 text-xs sm:text-sm leading-relaxed break-words min-w-0 font-medium">
                          {state.selectedService.variantDescriptions[state.selectedVariant]}
                        </p>
                      )}
                      {state.selectedService?.features && state.selectedService.features.length > 0 && (
                        <ul className="space-y-1 pt-1">
                          {state.selectedService.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start text-xs text-stone-600 break-words min-w-0">
                              <Check size={12} className="mr-1.5 text-sage-500 flex-shrink-0 mt-0.5" />
                              <span className="min-w-0">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="pt-1">
                        <Button variant="outline" size="sm" className="min-h-[40px] touch-manipulation w-full sm:w-auto" onClick={() => setChangingService(true)}>Change Service</Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Booking Card — below service on mobile, right column on desktop */}
                <div className="order-2 lg:col-span-7 min-w-0 w-full">
                  {changingService ? renderServicePicker() : <div className="bg-white rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 border border-stone-100 shadow-sm min-w-0 w-full overflow-hidden">
                    <h3 className="font-serif text-xl sm:text-2xl text-stone-900 mb-2">Book Appointment</h3>
                    <p className="mb-4 md:mb-6">
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => setState(s => ({ ...s, step: 'details' }))}
                        className="touch-manipulation"
                      >
                        Not sure yet? Pick a date and time later →
                      </Button>
                    </p>
                    {/* Select Date */}
                    <div className="mb-6 md:mb-8">
                      <label className="text-xs font-bold text-stone-400 uppercase tracking-widest block mb-3 md:mb-4">Select Date</label>
                      
                      <div className="flex flex-nowrap items-center gap-2 mb-3 md:mb-4">
                        <button 
                          onClick={goToPreviousWeek}
                          disabled={!canGoBack}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition-colors touch-manipulation flex-shrink-0 cursor-pointer disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed bg-stone-100 active:bg-stone-200"
                          aria-label="Previous month"
                        >
                          <ChevronLeft size={22} className={canGoBack ? 'text-stone-600' : 'text-stone-300'} aria-hidden="true" />
                        </button>
                        <h4 className="font-serif text-base sm:text-lg text-stone-900 flex-1 text-center min-w-0 truncate px-1" id="calendar-month-label">
                          {format(state.selectedDate || visibleStartDate, 'MMMM yyyy')}
                        </h4>
                        <button 
                          onClick={goToNextWeek}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-stone-100 active:bg-stone-200 transition-colors text-stone-600 touch-manipulation flex-shrink-0 bg-stone-100 cursor-pointer"
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
                                flex-shrink-0 flex flex-col items-center justify-center min-w-[56px] w-14 h-[60px] sm:h-16 rounded-full border-2 transition-all touch-manipulation cursor-pointer
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
                        <label className="flex items-center gap-2 text-xs font-bold text-stone-400 uppercase tracking-widest break-words min-w-0">
                          <Wand2 size={14} className="text-sage-500 shrink-0" aria-hidden />
                          Select Available Time(s)
                        </label>
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
                                min-h-[40px] py-2.5 px-3 sm:px-4 rounded-full text-sm font-medium border-2 transition-all touch-manipulation
                                ${isSelected 
                                  ? 'border-stone-900 bg-white text-stone-900 cursor-pointer' 
                                  : isDisabled
                                    ? 'border-transparent bg-stone-50 text-stone-300 line-through cursor-not-allowed'
                                    : 'border-transparent bg-stone-50 text-stone-700 hover:bg-stone-100 active:bg-stone-100 cursor-pointer'
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
                      className="w-full rounded-full py-3 min-h-[44px] touch-manipulation"
                      disabled={!state.selectedDate || state.selectedTimes.length === 0}
                      onClick={() => setState(s => ({ ...s, step: 'details' }))}
                    >
                      Book Appointment
                    </Button>
                  </div>}
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
                    className="w-full px-4 sm:px-6 py-3 sm:py-3.5 bg-stone-50 text-stone-900 border-2 border-stone-50 rounded-xl md:rounded-2xl focus:bg-white focus:ring-2 focus:ring-sage-500 focus:border-sage-500 focus:outline-none transition-all placeholder:text-stone-300 text-base sm:text-lg min-h-[44px]"
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
                      className="w-full px-4 sm:px-6 py-3 sm:py-3.5 bg-stone-50 text-stone-900 border-2 border-stone-50 rounded-xl md:rounded-2xl focus:bg-white focus:ring-2 focus:ring-sage-500 focus:border-sage-500 focus:outline-none transition-all placeholder:text-stone-300 min-h-[44px]"
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
                      required
                      aria-required="true"
                      className="w-full px-4 sm:px-6 py-3 sm:py-3.5 bg-stone-50 text-stone-900 border-2 border-stone-50 rounded-xl md:rounded-2xl focus:bg-white focus:ring-2 focus:ring-sage-500 focus:border-sage-500 focus:outline-none transition-all placeholder:text-stone-300 min-h-[44px]"
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
                    className="w-full px-4 sm:px-6 py-3 sm:py-3.5 bg-stone-50 text-stone-900 border-2 border-stone-50 rounded-xl md:rounded-2xl focus:bg-white focus:ring-2 focus:ring-sage-500 focus:border-sage-500 focus:outline-none transition-all placeholder:text-stone-300 resize-none min-h-[96px]"
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
                disabled={!state.customerDetails.name.trim() || !state.customerDetails.email.trim() || !state.customerDetails.phone.trim()}
                onClick={async () => {
                  try {
                    await fetch('/api/send-booking-confirmation', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        customerName: state.customerDetails.name,
                        customerEmail: state.customerDetails.email,
                        customerPhone: state.customerDetails.phone,
                        notes: state.customerDetails.notes,
                        service: state.selectedService?.title,
                        date: state.selectedDate ? format(state.selectedDate, 'MMMM d, yyyy') : '',
                        times: state.selectedTimes,
                      }),
                    });
                  } catch (e) {
                    console.error('Booking submission failed:', e);
                  }
                  setState(s => ({ ...s, step: 'confirmation' }));
                }}
             >
                Complete Booking
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
          Thank you, {state.customerDetails.name}. A confirmation email has been sent to <span className="text-stone-900 font-medium break-all">{state.customerDetails.email}</span>.
          {(!state.selectedDate || state.selectedTimes.length === 0) && (
            <> We&apos;ll be in touch to find a date and time that works for your session.</>
          )}
        </p>
        <div className="bg-stone-50 p-5 sm:p-8 md:p-10 rounded-2xl md:rounded-3xl border border-stone-100 text-left mb-8 sm:mb-12 space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 border-b border-stone-200 pb-4">
                <span className="text-stone-400 font-bold uppercase tracking-widest text-xs">Service</span>
                <span className="text-stone-900 font-bold text-sm sm:text-base">
                  {state.selectedService?.title}
                  {state.selectedVariant && state.selectedService?.priceVariants && (
                    <span className="font-normal text-stone-600"> ({state.selectedVariant === 'online' ? 'Online' : 'In-person'})</span>
                  )}
                </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                <span className="text-stone-400 font-bold uppercase tracking-widest text-xs">
                  {state.selectedTimes.length > 1 ? 'Date & Availability' : 'Date & Time'}
                </span>
                <div className="text-right sm:text-right">
                  {state.selectedDate && state.selectedTimes.length > 0 ? (
                    <>
                      <span className="text-stone-900 font-bold block text-sm sm:text-base">{format(state.selectedDate, 'MMMM do')}</span>
                      {state.selectedTimes.length === 1 ? (
                        <span className="text-stone-600 text-sm block">@ {state.selectedTimes[0]}</span>
                      ) : (
                        <span className="text-stone-600 text-sm block">{state.selectedTimes.join(', ')}</span>
                      )}
                    </>
                  ) : (
                    <span className="text-stone-600 text-sm block italic">To be scheduled — we&apos;ll contact you to find a time that works.</span>
                  )}
                </div>
            </div>
        </div>
        <Button size="lg" className="rounded-full px-8 sm:px-12 min-h-[48px] w-full sm:w-auto max-w-xs mx-auto touch-manipulation" onClick={() => window.location.href = '/'}>Return to Home</Button>
    </div>
  );

  const effectivePrice = getEffectivePrice(state.selectedService, state.selectedVariant);
  const discountedPrice =
    effectivePrice != null && saleActive
      ? Math.round(effectivePrice * 0.8)
      : null;

  return (
    <div className="max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden">
        {/* First booking sale hidden for now
        {state.step !== 'confirmation' && (
          <FirstBookingSale variant="inline" onStateChange={handleSaleStateChange} />
        )}
        */}

        <div className="min-h-[480px] sm:min-h-[560px] md:min-h-[600px]">
            {state.step === 'service' && renderServices()}
            {state.step === 'date' && renderCalendar()}
            {state.step === 'details' && renderDetails()}
            {state.step === 'confirmation' && renderConfirmation()}
        </div>
    </div>
  );
};
