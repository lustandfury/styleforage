import React from 'react';
import { BookingWizard } from './components/BookingWizard';
import { AiStylist } from './components/AiStylist';
import { Button } from './components/ui/Button';
import { ArrowRight, Instagram, Mail, MapPin, Quote } from 'lucide-react';

const Header: React.FC = () => (
  <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 border-b border-stone-100">
    <div className="container mx-auto px-4 h-16 flex items-center justify-between">
      <div className="font-serif text-2xl font-semibold tracking-tight text-stone-900">
        Style Forage
      </div>
      <nav className="hidden md:flex gap-8 text-sm font-medium text-stone-600">
        <a href="#about" className="hover:text-stone-900 transition-colors">About</a>
        <a href="#services" className="hover:text-stone-900 transition-colors">Services</a>
        <a href="#testimonials" className="hover:text-stone-900 transition-colors">Stories</a>
      </nav>
      <Button 
        size="sm" 
        onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
      >
        Book Consultation
      </Button>
    </div>
  </header>
);

const Hero: React.FC = () => (
  <section className="relative pt-20 pb-32 md:pt-32 md:pb-48 overflow-hidden">
    <div className="absolute inset-0 -z-10">
       <div className="absolute inset-0 bg-stone-50/90 mix-blend-multiply"></div>
       <img 
         src="https://picsum.photos/id/1059/1600/900" 
         alt="Background texture" 
         className="w-full h-full object-cover opacity-20"
       />
    </div>
    
    <div className="container mx-auto px-4 text-center">
      <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-medium text-stone-900 mb-6 tracking-tight leading-tight">
        Curating Confidence <br/> Through Your Wardrobe.
      </h1>
      <p className="text-stone-600 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
        Personal styling that isn't just about clothes—it's about self-expression. 
        Discover a wardrobe that works for your lifestyle and celebrates your individuality.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button size="lg" onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}>
          Start Your Journey
        </Button>
        <Button variant="outline" size="lg" onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}>
          Learn More
        </Button>
      </div>
    </div>
  </section>
);

const About: React.FC = () => {
  return (
    <section id="about" className="py-24 bg-white relative">
       <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
             <div className="order-2 md:order-1">
                <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-stone-900 leading-tight mb-8">
                  Effortless style for <br/> every body & every budget.
                </h2>
                <div className="pl-6 border-l-2 border-sage-200">
                   <h3 className="font-serif text-xl font-bold text-stone-900 mb-4">Roslyn Costanzo</h3>
                   <div className="space-y-5 text-stone-600 leading-relaxed font-light">
                      <p>
                        Hi, I'm Roz and I've been obsessed with fashion and shopping since I got my first pay cheque in 1992—which I immediately spent at Smart Set. I have also worked as a style editor at two national lifestyle magazines, and most recently, as a wardrobe consultant, helping people like you, find and refine their personal style.
                      </p>
                      <p>
                        Styling is all about helping people feel their best because when you look good, you feel good. If you need a boost and are tired of feeling frustrated every time you get dressed for the day, give me a call!
                      </p>
                   </div>
                   <div className="mt-6">
                      <a href="#" className="text-sage-600 font-medium hover:text-sage-800 inline-flex items-center gap-2 transition-colors">
                        Follow on Instagram <ArrowRight size={16}/>
                      </a>
                   </div>
                </div>
             </div>
             <div className="order-1 md:order-2 relative">
                <div className="aspect-[4/5] rounded-none md:rounded-lg overflow-hidden relative z-10 shadow-lg">
                  <img 
                    src="roz.png" 
                    onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80" }}
                    alt="Roslyn Costanzo" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-6 -right-6 w-full h-full border-2 border-stone-900 rounded-lg -z-0 hidden md:block"></div>
             </div>
          </div>
       </div>
    </section>
  );
};

const Testimonials: React.FC = () => {
  const testimonials = [
    {
      id: 1,
      name: "Christine Kwok",
      role: "Wardrobe Edit",
      text: "Working with Roslyn was lovely. Online, she knew exactly what I wanted and sent me a few suggestions. In person, it was like chatting with a girlfriend and she was able to find me pieces that go together nicely as well as work with my existing wardrobe. As a mom herself, Roslyn understands the types of clothes moms need to be in, but she's able to find pieces that are stylish and can bring me to a dinner with girlfriends after a play date in the park.",
    },
    {
      id: 2,
      name: "Ellen Bayley",
      role: "Full Consultation",
      text: "I loved working with Roz because she knows fashion and she knew the right fashion for me. She thrives on helping people look and feel good. Her sweet personality and non-judgemental approach made the wardrobe consultation and in-store shop a delightful experience! Roz helped me put together outfits that are work-appropriate, stylish, flattering and decently priced. My family says I’ve never looked so beautiful and confident.",
    },
    {
      id: 3,
      name: "Kirsten Almon",
      role: "Virtual Styling",
      text: "Just had a chance to look at everything and you've totally nailed it! Thank you for all of the info and suggestions – I love that you also noted what would be best buys to begin with. I want it all!!",
    },
    {
      id: 4,
      name: "Lisa Ketchmark",
      role: "Personal Shopping",
      text: "I had a great experience shopping with Roz. She was very organized with outfits picked out in multiple stores. She helped me expand my wardrobe, within my budget, and made the experience fun. It was so worth the investment and my closet thanks her. I'm excited to book my next shopping adventure. Roslyn, you rock my dear:)",
    }
  ];

  return (
    <section id="testimonials" className="py-24 bg-white relative">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl md:text-4xl text-stone-900 mb-4">Client Love Notes</h2>
          <div className="h-1 w-20 bg-sage-500 mx-auto rounded-full"></div>
          <p className="mt-4 text-stone-500">Real stories from real wardrobes.</p>
        </div>
        
        {/* Masonry Layout using Columns */}
        <div className="md:columns-2 gap-8 space-y-8 max-w-5xl mx-auto">
          {testimonials.map((t) => (
            <div key={t.id} className="break-inside-avoid bg-stone-50 p-8 rounded-lg relative hover:shadow-md transition-all duration-300 border border-stone-100 group">
              <Quote className="absolute top-6 left-6 text-sage-500/20 group-hover:text-sage-500/40 transition-colors" size={48} />
              <div className="relative z-10 pt-4">
                <p className="text-stone-600 leading-relaxed mb-6 font-light italic">
                  "{t.text}"
                </p>
                <div className="flex items-center gap-4 pt-4 border-t border-stone-200/50">
                  <div className="h-10 w-10 rounded-full bg-sage-200 flex items-center justify-center text-sage-800 font-serif font-bold text-lg">
                    {t.name[0]}
                  </div>
                  <div>
                    <h4 className="font-medium text-stone-900">{t.name}</h4>
                    <span className="text-xs text-stone-500 uppercase tracking-wider">{t.role}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Footer: React.FC = () => (
  <footer className="bg-stone-900 text-stone-400 py-12 border-t border-stone-800">
    <div className="container mx-auto px-4">
      <div className="grid md:grid-cols-4 gap-8 mb-8">
        <div className="col-span-1 md:col-span-2">
          <span className="font-serif text-2xl text-stone-100 block mb-4">Style Forage</span>
          <p className="max-w-xs text-sm">
            Elevating everyday style with intention and grace. 
            Book your consultation today and step into your best self.
          </p>
        </div>
        <div>
          <h4 className="text-stone-100 font-medium mb-4">Links</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-white transition-colors">Home</a></li>
            <li><a href="#services" className="hover:text-white transition-colors">Services</a></li>
            <li><a href="#booking" className="hover:text-white transition-colors">Book Now</a></li>
            <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-stone-100 font-medium mb-4">Connect</h4>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors"><Instagram size={20} /></a>
            <a href="#" className="hover:text-white transition-colors"><Mail size={20} /></a>
          </div>
        </div>
      </div>
      <div className="pt-8 border-t border-stone-800 text-xs text-center">
        © {new Date().getFullYear()} Style Forage. All rights reserved.
      </div>
    </div>
  </footer>
);

export default function App() {
  return (
    <div className="min-h-screen flex flex-col font-sans text-stone-900">
      <Header />
      <main className="flex-1">
        <Hero />
        <About />
        
        {/* Services / Booking Section Wrapper - Now with background */}
        <div id="services" className="bg-stone-50/50 border-y border-stone-100">
             <BookingWizard />
        </div>
        
        <Testimonials />
      </main>
      <Footer />
      <AiStylist />
    </div>
  );
}