import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Hero } from '../components/sections/Hero';
import { About } from '../components/sections/About';
import { Testimonials } from '../components/sections/Testimonials';
import { Button } from '../components/ui/Button';
import { Clock, ChevronRight } from 'lucide-react';

const SERVICES = [
  {
    id: 'closet-edit',
    title: 'The Closet Edit',
    description: 'A thoughtful review of your clothes, focused on fit, comfort, and relevance.',
    price: 250,
    durationMin: 150,
    image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'full-style-reset',
    title: 'The Full Style Reset Package',
    description: 'For clients ready for a meaningful refresh and a wardrobe that feels aligned.',
    price: 600,
    durationMin: 300,
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'personal-shop',
    title: 'Personal Shop',
    description: 'Intentional shopping, guided by fit, comfort, and what’s current.',
    price: 350,
    durationMin: 180,
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'style-refresh',
    title: 'Style Refresh',
    description: 'A focused update for a season, event, trip, or life change.',
    price: 300,
    durationMin: 120,
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'corporate-workshops',
    title: 'Corporate Style Workshops',
    description: 'Practical style talks for teams to show up with confidence and consistency.',
    price: 500,
    durationMin: 60,
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80'
  }
];

export const Home: React.FC = () => {
  const navigate = useNavigate();

  const handleBookService = (serviceId: string) => {
    navigate(`/book/${serviceId}`);
  };

  return (
    <div className="animate-fade-in">
      <Helmet>
        <title>Style Forage | Personal Styling & Wardrobe Consultation</title>
        <meta name="description" content="Curating confidence in every detail. Personal styling services including closet edits, wardrobe consultations, and personal shopping." />
      </Helmet>
      <Hero />
      
      {/* Thoughtful Approach Section */}
      <section className="py-16 md:py-24 bg-white border-b border-stone-100">
        <div className="container mx-auto px-4 text-center">
             <h2 className="font-serif text-3xl md:text-5xl text-stone-900 mb-4 md:mb-6">A Thoughtful Approach</h2>
             <p className="max-w-2xl mx-auto text-stone-600 mb-8 md:mb-12 leading-relaxed text-base md:text-lg px-0">
               I take a thoughtful, step-by-step approach. Most clients begin with a closet edit, 
               so we can shop intentionally and build a wardrobe that feels cohesive, wearable, and truly theirs.
             </p>
             <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto mt-8 md:mt-12">
                <div className="p-6 md:p-10 bg-stone-50 rounded-2xl transition-all text-left">
                    <h3 className="font-serif text-xl md:text-2xl mb-3 md:mb-4 text-stone-800">The Closet Edit</h3>
                    <p className="text-stone-500 text-sm md:text-base leading-relaxed">A fresh perspective focused on fit, comfort, and relevance to your life today.</p>
                </div>
                <div className="p-6 md:p-10 bg-stone-50 rounded-2xl transition-all text-left">
                    <h3 className="font-serif text-xl md:text-2xl mb-3 md:mb-4 text-stone-800">Full Style Reset</h3>
                    <p className="text-stone-500 text-sm md:text-base leading-relaxed">For clients ready for a meaningful refresh and a wardrobe that feels aligned.</p>
                </div>
                <div className="p-6 md:p-10 bg-stone-50 rounded-2xl transition-all text-left">
                    <h3 className="font-serif text-xl md:text-2xl mb-3 md:mb-4 text-stone-800">Style Refresh</h3>
                    <p className="text-stone-500 text-sm md:text-base leading-relaxed">A focused update for a season, event, trip, or specific life change.</p>
                </div>
             </div>
        </div>
      </section>

      <About />

      {/* Services Grid Section */}
      <section id="services" className="py-20 md:py-32 bg-stone-50/50 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-20">
            <h2 className="font-serif text-3xl md:text-5xl text-stone-900 mb-4 md:mb-6">Curated Styling Services</h2>
            <div className="h-1.5 w-24 bg-sage-500 mx-auto rounded-full mb-4 md:mb-6"></div>
            <p className="text-stone-600 text-base md:text-lg max-w-xl mx-auto">
              Choose a service below to book your session. Click <strong>View Service Details</strong> to select and continue to the booking flow.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-12 gap-6 md:gap-8 max-w-6xl mx-auto">
            {SERVICES.map((service) => (
              <article 
                key={service.id}
                className={`group bg-white rounded-3xl overflow-hidden transition-all duration-500 border border-stone-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 flex flex-col text-left ${service.id === 'closet-edit' ? 'sm:col-span-2 lg:col-span-8' : 'lg:col-span-4'}`}
              >
                <div className="aspect-[4/3] overflow-hidden bg-stone-100 relative">
                    <img 
                      src={service.image} 
                      alt={service.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/20 transition-colors" />
                </div>
                <div className="p-6 md:p-8 flex flex-col flex-grow">
                    <h3 className="font-serif font-bold text-xl md:text-2xl text-stone-900 mb-3 md:mb-4 group-hover:text-sage-700 transition-colors">{service.title}</h3>
                    <p className="text-stone-500 text-sm md:text-base mb-6 md:mb-8 leading-relaxed flex-grow">{service.description}</p>
                    <div className="pt-6 border-t border-stone-100 flex items-center justify-between mb-6">
                        <div className="flex items-center text-stone-400 font-medium text-sm">
                            <Clock size={16} className="mr-2" aria-hidden="true" />
                            <span>{service.durationMin / 60}h</span>
                        </div>
                        <span className="font-serif font-bold text-xl md:text-2xl text-stone-900">
                          {service.id === 'corporate-workshops' ? 'Custom' : `$${service.price}`}
                        </span>
                    </div>
                    <Button
                      size="md"
                      className="w-full rounded-full"
                      onClick={() => handleBookService(service.id)}
                    >
                      View Service Details
                    </Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="bg-stone-900 text-stone-100 py-20 md:py-32 relative overflow-hidden">
          <div className="container mx-auto px-4 max-w-5xl relative z-10">
              <div className="text-center mb-12 md:mb-20">
                <h3 className="font-serif text-3xl md:text-5xl mb-4 md:mb-6">Our Philosophy</h3>
                <div className="h-1.5 w-24 bg-sage-500 mx-auto rounded-full"></div>
              </div>
              <div className="grid md:grid-cols-3 gap-12 md:gap-16 text-center">
                  <div className="space-y-4 md:space-y-6 group">
                      <div className="w-14 h-14 md:w-16 md:h-16 bg-sage-500/10 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-8 transition-transform group-hover:scale-110">
                        <span className="text-sage-500 font-serif text-2xl md:text-3xl">01</span>
                      </div>
                      <h4 className="font-serif text-xl md:text-2xl">Comfort First</h4>
                      <p className="text-stone-400 text-sm md:text-base leading-relaxed">Style shouldn't be painful. We find pieces that move with you and feel amazing.</p>
                  </div>
                  <div className="space-y-4 md:space-y-6 group">
                      <div className="w-14 h-14 md:w-16 md:h-16 bg-sage-500/10 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-8 transition-transform group-hover:scale-110">
                        <span className="text-sage-500 font-serif text-2xl md:text-3xl">02</span>
                      </div>
                      <h4 className="font-serif text-xl md:text-2xl">Sustainable</h4>
                      <p className="text-stone-400 text-sm md:text-base leading-relaxed">Buying better, not more. We focus on intentional shopping and timeless quality.</p>
                  </div>
                  <div className="space-y-4 md:space-y-6 group">
                      <div className="w-14 h-14 md:w-16 md:h-16 bg-sage-500/10 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-8 transition-transform group-hover:scale-110">
                        <span className="text-sage-500 font-serif text-2xl md:text-3xl">03</span>
                      </div>
                      <h4 className="font-serif text-xl md:text-2xl">Authentic</h4>
                      <p className="text-stone-400 text-sm md:text-base leading-relaxed">Personal style is about defining what makes you unique—not chasing every trend.</p>
                  </div>
              </div>
          </div>
      </section>

      <Testimonials />
    </div>
  );
};