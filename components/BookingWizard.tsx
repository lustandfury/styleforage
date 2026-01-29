
import { Service, BookingState, TimeSlot } from '../types';
import { Button } from './ui/Button';
import React, { useState, useEffect } from 'react';
// Fix: Removed startOfToday and startOfMonth from imports as they are reported as missing exports in this environment.
import { format, addDays, endOfMonth, eachDayOfInterval, isSameDay, getDay, isBefore } from 'date-fns';
import { Check, ChevronLeft, ChevronRight, CreditCard, Clock, Lock, Sparkles } from 'lucide-react';

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
  { time: '09:00 AM', available: true },
  { time: '11:00 AM', available: true },
  { time: '02:00 PM', available: true },
  { time: '04:00 PM', available: true },
];

interface BookingWizardProps {
  initialServiceId?: string;
}

export const BookingWizard: React.FC<BookingWizardProps> = ({ initialServiceId }) => {
  const [state, setState] = useState<BookingState>({
    step: initialServiceId ? 'date' : 'service',
    selectedService: initialServiceId ? SERVICES.find(s => s.id === initialServiceId) || null : null,
    selectedDate: null,
    selectedTime: null,
    customerDetails: { name: '', email: '', phone: '', notes: '' }
  });

  // Helper function to replace startOfToday()
  const getTodayAtMidnight = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const today = getTodayAtMidnight();
  const [currentMonth, setCurrentMonth] = useState(today);

  // Handle step sync if prop changes
  useEffect(() => {
    if (initialServiceId) {
      const service = SERVICES.find(s => s.id === initialServiceId);
      if (service) {
        setState(s => ({ ...s, step: 'date', selectedService: service }));
      }
    }
  }, [initialServiceId]);

  const renderServices = () => (
    <div className="grid lg:grid-cols-3 gap-8">
      {SERVICES.map((service) => (
        <div 
          key={service.id}
          className="group bg-white rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 border border-stone-100 shadow-sm hover:shadow-xl"
          onClick={() => setState(s => ({ ...s, selectedService: service, step: 'date' }))}
        >
          <div className="aspect-[4/3] overflow-hidden">
              <img src={service.image} alt={service.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
          </div>
          <div className="p-8">
              <h4 className="font-serif font-bold text-xl text-stone-900 mb-4">{service.title}</h4>
              <p className="text-stone-500 text-sm mb-6">{service.description}</p>
              <Button fullWidth>Select Service</Button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderCalendar = () => {
    // Fix: Replaced startOfMonth(currentMonth) with native Date logic to avoid missing export error.
    const firstDayCurrentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const days = eachDayOfInterval({
        start: firstDayCurrentMonth,
        end: endOfMonth(firstDayCurrentMonth),
    });

    return (
        <div className="animate-fade-in max-w-6xl mx-auto py-12">
             <div className="grid lg:grid-cols-12 gap-12">
                <div className="lg:col-span-4 space-y-8">
                  <div className="bg-stone-50 p-8 rounded-3xl border border-stone-100 shadow-sm">
                    <span className="text-sage-600 font-bold uppercase tracking-widest text-xs block mb-4">Your Selection</span>
                    <h3 className="font-serif text-2xl text-stone-900 mb-2">{state.selectedService?.title}</h3>
                    <div className="flex items-center text-stone-500 text-sm mb-6">
                      <Clock size={16} className="mr-2" />
                      {state.selectedService ? state.selectedService.durationMin / 60 : 0} Hours
                    </div>
                    <div className="text-2xl font-serif font-bold text-stone-900 mb-6">
                      {state.selectedService?.id === 'corporate-workshops' ? 'Custom' : `$${state.selectedService?.price}`}
                    </div>
                    <p className="text-stone-600 text-sm leading-relaxed mb-6 italic">
                      "{state.selectedService?.description}"
                    </p>
                    <Button variant="outline" size="sm" onClick={() => window.history.back()}>Change Service</Button>
                  </div>
                </div>

                <div className="lg:col-span-8 space-y-12">
                  <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h4 className="font-serif text-2xl text-stone-900">{format(firstDayCurrentMonth, 'MMMM yyyy')}</h4>
                        <div className="flex gap-2">
                            <button onClick={() => setCurrentMonth(addDays(firstDayCurrentMonth, -1))} className="p-2 hover:bg-stone-50 rounded-full transition-colors"><ChevronLeft size={24}/></button>
                            <button onClick={() => setCurrentMonth(addDays(firstDayCurrentMonth, 32))} className="p-2 hover:bg-stone-50 rounded-full transition-colors"><ChevronRight size={24}/></button>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-3">
                        {Array.from({ length: getDay(firstDayCurrentMonth) }).map((_, i) => <div key={i} />)}
                        {days.map((day) => {
                             const isSelected = state.selectedDate && isSameDay(day, state.selectedDate);
                             const isPast = isBefore(day, today);
                             return (
                                <button
                                    key={day.toString()}
                                    disabled={isPast}
                                    onClick={() => setState(s => ({ ...s, selectedDate: day, selectedTime: null }))}
                                    className={`
                                        aspect-square rounded-2xl flex items-center justify-center text-sm font-medium transition-all
                                        ${isSelected ? 'bg-stone-900 text-white shadow-lg scale-105' : 'hover:bg-sage-50 text-stone-700'}
                                        ${isPast ? 'text-stone-200 cursor-not-allowed hover:bg-transparent' : ''}
                                    `}
                                >
                                    {format(day, 'd')}
                                </button>
                             );
                        })}
                    </div>
                  </div>

                  {state.selectedDate && (
                    <div className="bg-stone-50 rounded-3xl p-8 animate-in slide-in-from-top-4 duration-500">
                      <h4 className="font-serif text-2xl text-stone-900 mb-8">Available Times for {format(state.selectedDate, 'MMMM do')}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {TIME_SLOTS.map((slot) => (
                              <button
                                  key={slot.time}
                                  onClick={() => setState(s => ({ ...s, selectedTime: slot.time }))}
                                  className={`
                                      py-4 rounded-2xl text-sm font-bold border transition-all
                                      ${state.selectedTime === slot.time 
                                          ? 'bg-sage-500 border-sage-500 text-white shadow-lg scale-105' 
                                          : 'bg-white border-stone-100 text-stone-700 hover:border-sage-300'
                                      }
                                  `}
                              >
                                  {slot.time}
                              </button>
                          ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-8">
                      <Button 
                        size="lg"
                        className="px-12 rounded-full"
                        disabled={!state.selectedDate || !state.selectedTime}
                        onClick={() => setState(s => ({ ...s, step: 'details' }))}
                      >
                        Your Details <ChevronRight className="ml-2" />
                      </Button>
                  </div>
                </div>
             </div>
        </div>
    );
  };

  const renderDetails = () => (
    <div className="animate-fade-in max-w-2xl mx-auto py-20">
         <div className="text-center mb-12">
            <h3 className="text-4xl font-serif text-stone-900 mb-4">Finalizing Your Details</h3>
            <p className="text-stone-500">Tell me a bit about yourself so we can make the most of our session.</p>
         </div>
         
         <div className="bg-white p-10 md:p-14 rounded-3xl border border-stone-100 shadow-xl space-y-8">
            <div className="space-y-2">
                <label className="text-sm font-bold text-stone-800 uppercase tracking-widest">Full Name</label>
                <input 
                    type="text" 
                    className="w-full px-6 py-4 bg-stone-50 text-stone-900 border-2 border-stone-50 rounded-2xl focus:bg-white focus:ring-2 focus:ring-sage-500 focus:border-sage-500 focus:outline-none transition-all placeholder:text-stone-300 text-lg"
                    placeholder="Jane Doe"
                    value={state.customerDetails.name}
                    onChange={(e) => setState(s => ({...s, customerDetails: {...s.customerDetails, name: e.target.value}}))}
                />
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-800 uppercase tracking-widest">Email</label>
                  <input 
                      type="email" 
                      className="w-full px-6 py-4 bg-stone-50 text-stone-900 border-2 border-stone-50 rounded-2xl focus:bg-white focus:ring-2 focus:ring-sage-500 focus:border-sage-500 focus:outline-none transition-all placeholder:text-stone-300"
                      placeholder="jane@example.com"
                      value={state.customerDetails.email}
                      onChange={(e) => setState(s => ({...s, customerDetails: {...s.customerDetails, email: e.target.value}}))}
                  />
              </div>
              <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-800 uppercase tracking-widest">Phone</label>
                  <input 
                      type="tel" 
                      className="w-full px-6 py-4 bg-stone-50 text-stone-900 border-2 border-stone-50 rounded-2xl focus:bg-white focus:ring-2 focus:ring-sage-500 focus:border-sage-500 focus:outline-none transition-all placeholder:text-stone-300"
                      placeholder="(555) 000-0000"
                      value={state.customerDetails.phone}
                      onChange={(e) => setState(s => ({...s, customerDetails: {...s.customerDetails, phone: e.target.value}}))}
                  />
              </div>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-bold text-stone-800 uppercase tracking-widest">Notes & Style Goals</label>
                <textarea 
                    rows={4}
                    className="w-full px-6 py-4 bg-stone-50 text-stone-900 border-2 border-stone-50 rounded-2xl focus:bg-white focus:ring-2 focus:ring-sage-500 focus:border-sage-500 focus:outline-none transition-all placeholder:text-stone-300 resize-none"
                    placeholder="E.g. I need help dressing for a new career path..."
                    value={state.customerDetails.notes}
                    onChange={(e) => setState(s => ({...s, customerDetails: {...s.customerDetails, notes: e.target.value}}))}
                />
            </div>
         </div>

         <div className="flex justify-between items-center mt-12">
             <Button variant="ghost" onClick={() => setState(s => ({ ...s, step: 'date' }))}>
                <ChevronLeft size={18} className="mr-2"/> Back
             </Button>
             <Button 
                size="lg"
                className="px-12 rounded-full"
                disabled={!state.customerDetails.name || !state.customerDetails.email}
                onClick={() => setState(s => ({ ...s, step: 'payment' }))}
             >
                Continue to Payment
             </Button>
         </div>
    </div>
  );

  const renderPayment = () => (
    <div className="animate-fade-in max-w-xl mx-auto py-20">
        <div className="text-center mb-12">
            <h3 className="text-4xl font-serif text-stone-900 mb-4">Secure Checkout</h3>
            <p className="text-stone-500">Confirm your session and complete payment.</p>
        </div>
        
        <div className="bg-stone-50 p-8 rounded-3xl mb-12 border border-stone-100">
            <div className="flex justify-between items-start mb-6 pb-6 border-b border-stone-200">
                <div>
                  <h4 className="font-serif text-xl text-stone-900 mb-1">{state.selectedService?.title}</h4>
                  <div className="text-stone-500 text-sm">
                    {state.selectedDate && format(state.selectedDate, 'EEEE, MMMM do')} @ {state.selectedTime}
                  </div>
                </div>
                <div className="font-serif text-2xl font-bold text-stone-900">
                  ${state.selectedService?.price}
                </div>
            </div>
            <div className="flex justify-between font-bold text-lg text-stone-900 uppercase tracking-widest">
                <span>Total Due</span>
                <span>${state.selectedService?.price}</span>
            </div>
        </div>

        <div className="bg-white p-10 rounded-3xl border border-stone-100 shadow-xl space-y-6">
             <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-[0.2em]">Card Number</label>
                <div className="border-2 border-stone-50 bg-stone-50 rounded-2xl p-4 flex items-center">
                    <CreditCard className="text-stone-300 mr-4" size={24} />
                    <input 
                        type="text" 
                        placeholder="•••• •••• •••• ••••" 
                        className="flex-1 bg-transparent outline-none text-stone-900 text-lg tracking-widest placeholder:text-stone-200"
                        defaultValue="4242 4242 4242 4242"
                    />
                </div>
             </div>
             <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-[0.2em]">Expiry</label>
                  <input type="text" placeholder="MM / YY" className="w-full px-4 py-4 bg-stone-50 border-2 border-stone-50 rounded-2xl focus:bg-white focus:outline-none focus:border-sage-300 text-center" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-[0.2em]">CVC</label>
                  <input type="text" placeholder="•••" className="w-full px-4 py-4 bg-stone-50 border-2 border-stone-50 rounded-2xl focus:bg-white focus:outline-none focus:border-sage-300 text-center" />
                </div>
             </div>
        </div>
        
        <div className="text-center mt-6 mb-12 text-stone-400 flex items-center justify-center gap-2">
            <Lock size={14} /> <span className="text-xs font-medium uppercase tracking-widest">Encrypted via Stripe</span>
        </div>

        <div className="flex flex-col gap-4">
           <Button 
              size="lg"
              className="py-6 rounded-full text-xl shadow-xl shadow-sage-500/20"
              onClick={() => setState(s => ({ ...s, step: 'confirmation' }))}
           >
              Confirm & Pay ${state.selectedService?.price}
           </Button>
           <Button variant="ghost" onClick={() => setState(s => ({ ...s, step: 'details' }))}>
              Go Back
           </Button>
        </div>
    </div>
  );

  const renderConfirmation = () => (
    <div className="text-center py-32 animate-fade-in max-w-2xl mx-auto">
        <div className="w-24 h-24 bg-sage-500 text-white rounded-full flex items-center justify-center mx-auto mb-10 shadow-xl shadow-sage-500/30">
            <Check size={48} />
        </div>
        <h2 className="text-5xl font-serif text-stone-900 mb-6 tracking-tight">Booking Confirmed!</h2>
        <p className="text-stone-500 text-xl leading-relaxed mb-12 font-light">
          Thank you, {state.customerDetails.name}. A confirmation email with preparation steps has been sent to <span className="text-stone-900 font-medium">{state.customerDetails.email}</span>.
        </p>
        <div className="bg-stone-50 p-10 rounded-3xl border border-stone-100 text-left mb-12 space-y-4">
            <div className="flex justify-between border-b border-stone-200 pb-4">
                <span className="text-stone-400 font-bold uppercase tracking-widest text-xs">Service</span>
                <span className="text-stone-900 font-bold">{state.selectedService?.title}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-stone-400 font-bold uppercase tracking-widest text-xs">Date & Time</span>
                <span className="text-stone-900 font-bold">{state.selectedDate && format(state.selectedDate, 'MMMM do')} @ {state.selectedTime}</span>
            </div>
        </div>
        <Button size="lg" className="rounded-full px-12" onClick={() => window.location.href = '/'}>Return to Home</Button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
        {state.step !== 'confirmation' && state.step !== 'service' && (
            <div className="flex justify-center mt-12">
                <div className="flex items-center gap-4">
                    {['Date', 'Details', 'Payment'].map((stepName, idx) => {
                        const steps = ['date', 'details', 'payment'];
                        const currentIdx = steps.indexOf(state.step);
                        const isActive = idx === currentIdx;
                        const isCompleted = idx < currentIdx;

                        return (
                            <div key={stepName} className="flex items-center">
                                <div className={`
                                    w-3 h-3 rounded-full transition-all duration-500
                                    ${isActive ? 'bg-sage-500 ring-4 ring-sage-500/20 scale-125' : isCompleted ? 'bg-stone-900' : 'bg-stone-200'}
                                `} />
                                {idx < 2 && <div className={`w-8 md:w-16 h-0.5 mx-2 ${isCompleted ? 'bg-stone-900' : 'bg-stone-100'}`} />}
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        <div className="min-h-[600px]">
            {state.step === 'service' && renderServices()}
            {state.step === 'date' && renderCalendar()}
            {state.step === 'details' && renderDetails()}
            {state.step === 'payment' && renderPayment()}
            {state.step === 'confirmation' && renderConfirmation()}
        </div>
    </div>
  );
};
