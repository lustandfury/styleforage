import React, { useState } from 'react';
import { Service, BookingState, TimeSlot } from '../types';
import { Button } from './ui/Button';
import { format, addDays, startOfToday, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay, isBefore } from 'date-fns';
import { Check, ChevronLeft, ChevronRight, CreditCard, Clock, Lock, Sparkles } from 'lucide-react';

const SERVICES: Service[] = [
  {
    id: 'wardrobe-edit',
    title: 'The Wardrobe Edit',
    description: 'We detox your closet, identifying key pieces and gaps. Perfect for a fresh start.',
    longDescription: "Transform your relationship with your closet. We'll sort through every piece together, deciding what to keep, tailor, or donate, creating a functional space that brings you joy every morning.",
    features: [
      "2-hour in-home consultation",
      "Body shape & color analysis",
      "Outfit combination creation",
      "Shopping list for missing essentials",
      "Donation coordination"
    ],
    price: 250,
    durationMin: 120,
    image: 'https://picsum.photos/id/1059/800/600'
  },
  {
    id: 'personal-shop',
    title: 'Personal Shopping',
    description: 'A curated shopping trip tailored to your budget and style goals. No stress, just style.',
    longDescription: "Experience shopping like never before. I'll pre-select pieces that flatter your figure and fit your lifestyle, ready for you to try on in a private dressing room. No digging through racks required.",
    features: [
      "3-hour guided shopping trip",
      "Pre-pulled items in your size",
      "Styling tips for each piece",
      "Budget management",
      "Exclusive store discounts"
    ],
    price: 350,
    durationMin: 180,
    image: 'https://picsum.photos/id/1071/800/600'
  },
  {
    id: 'total-overhaul',
    title: 'The Total Overhaul',
    description: 'Complete wardrobe edit plus two days of shopping and styling integration.',
    longDescription: "The ultimate style transformation. From clearing out the old to ushering in the new, this comprehensive package completely reimagines your personal brand over a dedicated weekend.",
    features: [
      "Full Wardrobe Edit session",
      "2 days of Personal Shopping",
      "In-home styling session with new purchases",
      "Digital lookbook of your outfits",
      "30 days of text support"
    ],
    price: 800,
    durationMin: 480,
    image: 'https://picsum.photos/id/338/800/600'
  }
];

// Mock Time Slots
const TIME_SLOTS: TimeSlot[] = [
  { time: '09:00 AM', available: true },
  { time: '11:00 AM', available: true },
  { time: '02:00 PM', available: false },
  { time: '04:00 PM', available: true },
];

export const BookingWizard: React.FC = () => {
  const [state, setState] = useState<BookingState>({
    step: 'service',
    selectedService: null,
    selectedDate: null,
    selectedTime: null,
    customerDetails: { name: '', email: '', phone: '', notes: '' }
  });

  const [currentMonth, setCurrentMonth] = useState(startOfToday());
  const today = startOfToday();

  // --- Step 1: Service Selection (Cards Only) ---
  const renderServices = () => (
    <div className="animate-fade-in space-y-10">
      <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
        {SERVICES.map((service) => (
          <div 
            key={service.id}
            className={`
              group relative flex flex-col bg-white rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 
              border border-stone-100 shadow-sm hover:shadow-xl hover:-translate-y-1
            `}
            onClick={() => setState(s => ({ ...s, selectedService: service, step: 'date' }))}
          >
            <div className="aspect-[4/3] overflow-hidden bg-stone-100 relative">
                <img 
                  src={service.image} 
                  alt={service.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-sage-900/0 group-hover:bg-sage-900/10 transition-colors duration-300" />
            </div>
            <div className="p-6 md:p-8 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-4">
                    <h4 className="font-serif font-bold text-xl text-stone-900 leading-tight group-hover:text-sage-700 transition-colors">{service.title}</h4>
                </div>
                <p className="text-stone-600 text-sm md:text-base mb-6 leading-relaxed flex-grow">
                  {service.description}
                </p>
                <div className="pt-6 border-t border-stone-100 flex items-center justify-between mt-auto">
                    <div className="flex items-center text-xs md:text-sm text-stone-500 font-medium bg-stone-50 px-3 py-1 rounded-full">
                        <Clock size={14} className="mr-1.5" />
                        {service.durationMin / 60} hours
                    </div>
                    <span className="font-serif font-bold text-lg text-stone-900 group-hover:text-sage-700 transition-colors">${service.price}</span>
                </div>
            </div>
            {/* Hover Indicator */}
            <div className="absolute top-4 right-4 h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm bg-white text-stone-300 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100">
               <ChevronRight size={16} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // --- Step 2: Calendar & Time ---
  const renderCalendar = () => {
    const firstDayCurrentMonth = startOfMonth(currentMonth);
    const days = eachDayOfInterval({
        start: firstDayCurrentMonth,
        end: endOfMonth(firstDayCurrentMonth),
    });

    const previousMonth = () => {
        const firstDayNextMonth = addDays(firstDayCurrentMonth, -1);
        setCurrentMonth(startOfMonth(firstDayNextMonth));
    };

    const nextMonth = () => {
        const firstDayNextMonth = addDays(firstDayCurrentMonth, 32);
        setCurrentMonth(startOfMonth(firstDayNextMonth));
    };

    return (
        <div className="animate-fade-in">
             {/* Selected Service Detailed Overview */}
             {state.selectedService && (
                <div className="bg-white rounded-2xl p-6 md:p-8 border border-stone-200 shadow-sm mb-12 flex flex-col md:flex-row gap-8 items-start animate-in slide-in-from-bottom-4 duration-500">
                    <div className="w-full md:w-1/3 aspect-[4/3] rounded-lg overflow-hidden bg-stone-100 flex-shrink-0 relative group">
                        <img src={state.selectedService.image} alt={state.selectedService.title} className="w-full h-full object-cover" />
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-stone-800 shadow-sm">
                            Selected Experience
                        </div>
                    </div>
                    <div className="flex-1 w-full">
                        <div className="flex justify-between items-start flex-wrap gap-4">
                            <div>
                                <h3 className="font-serif text-2xl md:text-3xl text-stone-900 mb-2">{state.selectedService.title}</h3>
                                <div className="text-stone-500 text-sm font-medium mb-4 flex items-center gap-4">
                                    <span className="flex items-center"><Clock size={14} className="mr-1.5"/> {state.selectedService.durationMin / 60} Hours</span>
                                    <span className="w-1 h-1 bg-stone-300 rounded-full"></span>
                                    <span>In-Person</span>
                                </div>
                            </div>
                            <div className="font-serif text-3xl text-stone-900">${state.selectedService.price}</div>
                        </div>
                        
                        <p className="text-stone-600 leading-relaxed mb-6 text-lg font-light">
                            {state.selectedService.longDescription || state.selectedService.description}
                        </p>
                        
                        {state.selectedService.features && (
                            <div>
                                <h5 className="font-medium text-stone-900 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                                    <Sparkles size={14} className="text-sage-500" /> What's Included
                                </h5>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    {state.selectedService.features.map((feature, idx) => (
                                        <div key={idx} className="flex items-start text-sm text-stone-700 bg-stone-50 p-2 rounded-lg">
                                            <div className="w-5 h-5 rounded-full bg-sage-100 text-sage-600 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                                                <Check size={12} />
                                            </div>
                                            <span>{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <div className="mt-6 md:hidden">
                            <Button variant="outline" size="sm" onClick={() => setState(s => ({ ...s, step: 'service' }))}>Change Service</Button>
                        </div>
                    </div>
                </div>
             )}

             <div className="flex items-center justify-between mb-8">
                 <h3 className="text-2xl font-serif text-stone-900">Choose a Date & Time</h3>
                 <div className="text-sm text-stone-500 hidden md:block">Timezone: Local</div>
             </div>
             
             <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
                {/* Calendar Grid */}
                <div className="lg:col-span-7">
                    <div className="bg-white border border-stone-100 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="font-medium text-lg font-serif">{format(firstDayCurrentMonth, 'MMMM yyyy')}</h4>
                            <div className="flex space-x-2">
                                <button onClick={previousMonth} className="p-2 hover:bg-stone-50 rounded-full text-stone-600 transition-colors"><ChevronLeft size={20}/></button>
                                <button onClick={nextMonth} className="p-2 hover:bg-stone-50 rounded-full text-stone-600 transition-colors"><ChevronRight size={20}/></button>
                            </div>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-stone-400 uppercase tracking-wider mb-4">
                            <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
                        </div>
                        <div className="grid grid-cols-7 gap-1 md:gap-2">
                            {Array.from({ length: getDay(firstDayCurrentMonth) }).map((_, i) => (
                                <div key={`empty-${i}`} />
                            ))}
                            {days.map((day) => {
                                 const isSelected = state.selectedDate && isSameDay(day, state.selectedDate);
                                 const isPast = isBefore(day, today);
                                 return (
                                    <button
                                        key={day.toString()}
                                        disabled={isPast}
                                        onClick={() => setState(s => ({ ...s, selectedDate: day, selectedTime: null }))}
                                        className={`
                                            h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center text-sm transition-all relative
                                            ${isSelected ? 'bg-stone-900 text-white shadow-md scale-105 z-10' : ''}
                                            ${!isSelected && !isPast ? 'hover:bg-sage-50 text-stone-700 hover:text-sage-700' : ''}
                                            ${isPast ? 'text-stone-300 cursor-not-allowed' : ''}
                                            ${isSameDay(day, today) && !isSelected ? 'text-sage-600 font-bold ring-1 ring-sage-200' : ''}
                                        `}
                                    >
                                        {format(day, 'd')}
                                    </button>
                                 );
                            })}
                        </div>
                    </div>
                </div>

                {/* Time Slots */}
                <div className="lg:col-span-5 flex flex-col">
                    <div className="bg-stone-50 rounded-2xl p-6 h-full border border-stone-100">
                        <h4 className="font-medium text-lg mb-4 font-serif text-stone-900 border-b border-stone-200 pb-4">
                            {state.selectedDate ? format(state.selectedDate, 'EEEE, MMMM do') : 'Select a date'}
                        </h4>
                        {!state.selectedDate ? (
                            <div className="h-40 flex items-center justify-center text-center text-stone-400 text-sm">
                                <p>Select a date from the calendar<br/>to view available times.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 animate-fade-in">
                                {TIME_SLOTS.map((slot) => (
                                    <button
                                        key={slot.time}
                                        disabled={!slot.available}
                                        onClick={() => setState(s => ({ ...s, selectedTime: slot.time }))}
                                        className={`
                                            w-full py-3 px-4 rounded-xl text-sm border transition-all flex justify-between items-center group
                                            ${state.selectedTime === slot.time 
                                                ? 'bg-sage-500 border-sage-500 text-white shadow-md' 
                                                : 'bg-white border-stone-200 text-stone-700'
                                            }
                                            ${!slot.available 
                                                ? 'opacity-50 cursor-not-allowed bg-stone-50' 
                                                : state.selectedTime !== slot.time && 'hover:border-sage-300 hover:shadow-sm'
                                            }
                                        `}
                                    >
                                        <span className="font-medium">{slot.time}</span>
                                        {state.selectedTime === slot.time && <Check size={16} />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
             </div>
             
             <div className="flex justify-between mt-10 border-t border-stone-100 pt-6">
                 <Button variant="ghost" onClick={() => setState(s => ({ ...s, step: 'service' }))}>
                    <ChevronLeft size={16} className="mr-2"/> Back
                 </Button>
                 <Button 
                    disabled={!state.selectedDate || !state.selectedTime}
                    onClick={() => setState(s => ({ ...s, step: 'details' }))}
                 >
                    Next: Your Details
                 </Button>
             </div>
        </div>
    );
  };

  // --- Step 3: Details ---
  const renderDetails = () => (
    <div className="animate-fade-in max-w-xl mx-auto">
         <h3 className="text-2xl font-serif text-stone-900 mb-6 text-center">Your Details</h3>
         <div className="space-y-5 bg-white p-6 md:p-8 rounded-2xl border border-stone-100 shadow-sm">
            <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Full Name</label>
                <input 
                    type="text" 
                    className="w-full p-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-transparent focus:outline-none transition-all"
                    placeholder="e.g. Jane Doe"
                    value={state.customerDetails.name}
                    onChange={(e) => setState(s => ({...s, customerDetails: {...s.customerDetails, name: e.target.value}}))}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Email Address</label>
                <input 
                    type="email" 
                    className="w-full p-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-transparent focus:outline-none transition-all"
                    placeholder="jane@example.com"
                    value={state.customerDetails.email}
                    onChange={(e) => setState(s => ({...s, customerDetails: {...s.customerDetails, email: e.target.value}}))}
                />
            </div>
             <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Phone Number</label>
                <input 
                    type="tel" 
                    className="w-full p-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-transparent focus:outline-none transition-all"
                    placeholder="(555) 123-4567"
                    value={state.customerDetails.phone}
                    onChange={(e) => setState(s => ({...s, customerDetails: {...s.customerDetails, phone: e.target.value}}))}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Style Goals / Notes</label>
                <textarea 
                    rows={4}
                    className="w-full p-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-transparent focus:outline-none transition-all resize-none"
                    placeholder="Tell me a bit about why you're booking..."
                    value={state.customerDetails.notes}
                    onChange={(e) => setState(s => ({...s, customerDetails: {...s.customerDetails, notes: e.target.value}}))}
                />
            </div>
         </div>
         <div className="flex justify-between mt-8">
             <Button variant="ghost" onClick={() => setState(s => ({ ...s, step: 'date' }))}>
                <ChevronLeft size={16} className="mr-2"/> Back
             </Button>
             <Button 
                disabled={!state.customerDetails.name || !state.customerDetails.email}
                onClick={() => setState(s => ({ ...s, step: 'payment' }))}
             >
                Continue to Payment
             </Button>
         </div>
    </div>
  );

  // --- Step 4: Mock Stripe Payment ---
  const renderPayment = () => (
    <div className="animate-fade-in max-w-lg mx-auto">
        <h3 className="text-2xl font-serif text-stone-900 mb-6 text-center">Secure Payment</h3>
        
        <div className="bg-stone-50 p-6 rounded-2xl mb-8 border border-stone-200">
            <h4 className="font-serif text-lg mb-4 text-stone-900">Order Summary</h4>
            <div className="flex justify-between text-sm mb-2 text-stone-700">
                <span>{state.selectedService?.title}</span>
                <span className="font-medium">${state.selectedService?.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mb-2 text-stone-500">
                <span>{state.selectedDate && format(state.selectedDate, 'MMM do')} at {state.selectedTime}</span>
            </div>
            <div className="border-t border-stone-200 my-4 pt-4 flex justify-between font-serif font-bold text-xl text-stone-900">
                <span>Total</span>
                <span>${state.selectedService?.price.toFixed(2)}</span>
            </div>
        </div>

        {/* Mock Stripe Element */}
        <div className="space-y-4 bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
             <div className="border border-stone-200 rounded-lg p-3 flex items-center bg-white focus-within:ring-2 focus-within:ring-sage-500 transition-all">
                <CreditCard className="text-stone-400 mr-3" size={20} />
                <input 
                    type="text" 
                    placeholder="Card number" 
                    className="flex-1 outline-none text-stone-900 placeholder:text-stone-400"
                    defaultValue="4242 4242 4242 4242"
                />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="border border-stone-200 rounded-lg p-3 bg-white focus-within:ring-2 focus-within:ring-sage-500 transition-all">
                    <input 
                        type="text" 
                        placeholder="MM / YY" 
                        className="w-full outline-none text-stone-900 placeholder:text-stone-400"
                    />
                </div>
                <div className="border border-stone-200 rounded-lg p-3 bg-white focus-within:ring-2 focus-within:ring-sage-500 transition-all">
                    <input 
                        type="text" 
                        placeholder="CVC" 
                        className="w-full outline-none text-stone-900 placeholder:text-stone-400"
                    />
                </div>
             </div>
        </div>
        
        <div className="flex items-center justify-center mt-6 mb-2 text-xs text-stone-400">
            <Lock size={12} className="mr-1" /> Payments secured by Stripe
        </div>

        <div className="flex justify-between mt-6">
             <Button variant="ghost" onClick={() => setState(s => ({ ...s, step: 'details' }))}>
                <ChevronLeft size={16} className="mr-2"/> Back
             </Button>
             <Button 
                onClick={() => setState(s => ({ ...s, step: 'confirmation' }))}
                className="ml-4 w-full md:w-auto min-w-[160px]"
             >
                Pay ${state.selectedService?.price}
             </Button>
         </div>
    </div>
  );

  // --- Step 5: Confirmation ---
  const renderConfirmation = () => (
    <div className="text-center py-16 animate-fade-in">
        <div className="w-20 h-20 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-8 text-sage-600 animate-in zoom-in duration-300">
            <Check size={40} />
        </div>
        <h2 className="text-3xl md:text-4xl font-serif text-stone-900 mb-4">Booking Confirmed!</h2>
        <p className="text-stone-600 max-w-md mx-auto mb-10 text-lg leading-relaxed">
            Thank you, {state.customerDetails.name}. We've sent a confirmation email to {state.customerDetails.email}. 
        </p>
        <div className="bg-stone-50 inline-block p-6 rounded-xl border border-stone-100 mb-10 text-left">
            <div className="text-sm text-stone-500 uppercase tracking-wider mb-1">Appointment</div>
            <div className="text-stone-900 font-medium text-lg">{state.selectedService?.title}</div>
            <div className="text-stone-600">{state.selectedDate && format(state.selectedDate, 'MMMM do')} at {state.selectedTime}</div>
        </div>
        <div>
           <Button onClick={() => window.location.reload()} variant="outline">Return Home</Button>
        </div>
    </div>
  );

  return (
    <section id="booking" className="py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-5xl mx-auto">
                
                {/* Header & Quote - Only visible on the first step (Service Selection) */}
                {state.step === 'service' && (
                  <div className="text-center space-y-4 max-w-2xl mx-auto mb-12 animate-fade-in">
                     <h3 className="text-3xl md:text-4xl font-serif text-stone-900">Curated Styling Packages</h3>
                     <div className="flex flex-col items-center justify-center gap-3 text-sage-700 font-medium px-4">
                        <p className="italic text-center text-lg">“My family says I’ve never looked so beautiful and confident.”</p>
                        <span className="text-xs uppercase tracking-widest text-stone-400">— Ellen Bayley</span>
                     </div>
                  </div>
                )}

                {/* Steps Indicator - Placed below header, above content */}
                {state.step !== 'confirmation' && (
                    <div className="flex justify-center mb-12 md:mb-16">
                        {['Service', 'Date', 'Details', 'Payment'].map((stepName, idx) => {
                            const steps = ['service', 'date', 'details', 'payment'];
                            const currentIdx = steps.indexOf(state.step);
                            const isActive = idx === currentIdx;
                            const isCompleted = idx < currentIdx;

                            return (
                                <div key={stepName} className="flex items-center">
                                    <div className={`
                                        flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full text-xs md:text-sm font-medium border-2 transition-all duration-300
                                        ${isActive ? 'border-sage-500 text-sage-600 bg-white scale-110 shadow-sm' : ''}
                                        ${isCompleted ? 'bg-sage-500 border-sage-500 text-white' : ''}
                                        ${!isActive && !isCompleted ? 'border-stone-200 text-stone-300' : ''}
                                    `}>
                                        {isCompleted ? <Check size={16}/> : idx + 1}
                                    </div>
                                    <span className={`hidden sm:inline-block ml-3 text-sm font-medium transition-colors ${isActive ? 'text-stone-900' : 'text-stone-400'}`}>{stepName}</span>
                                    {idx !== 3 && (
                                        <div className="w-8 md:w-16 h-0.5 mx-2 md:mx-4 bg-stone-100 overflow-hidden">
                                            <div className={`h-full bg-sage-500 transition-all duration-500 ${isCompleted ? 'w-full' : 'w-0'}`} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Main Step Content */}
                <div className="min-h-[500px]">
                    {state.step === 'service' && renderServices()}
                    {state.step === 'date' && renderCalendar()}
                    {state.step === 'details' && renderDetails()}
                    {state.step === 'payment' && renderPayment()}
                    {state.step === 'confirmation' && renderConfirmation()}
                </div>
            </div>
        </div>
    </section>
  );
};