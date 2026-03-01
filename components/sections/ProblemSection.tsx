import React from 'react';
import { FadeInOnScroll } from '../FadeInOnScroll';

export const ProblemSection: React.FC = () => (
  <section data-nav-theme="dark" className="py-16 md:py-24 mobile-menu-leather">
    <FadeInOnScroll>
      <div className="container mx-auto px-4">
        <div className="flex items-start gap-8">
          <div className="flex-1 max-w-2xl space-y-4 text-sage-200 text-sm md:text-base leading-relaxed font-light">
            <p className="font-serif text-white text-xl md:text-2xl font-bold" style={{ fontWeight: 700 }}>Your life is full by design.</p>
            <p><span className="text-white font-medium">Catch up.</span> Somewhere between the promotion, the move, the kids, the new chapter, your wardrobe fell behind. Half of it belongs to a version of you that no longer exists. You know it. You just haven't had a free Saturday to deal with it.</p>
            <p><span className="text-white font-medium">Keep up.</span> Even when you find something that works, life moves again. A new season, a body change, a different kind of event on the calendar. What worked in March doesn't work in September. Staying current takes more attention than you have to give.</p>
            <p><span className="text-white font-medium">Dress for the moment.</span> Then come the moments that matter. The presentation. The gala. The family photo. The trip. And instead of feeling ready, you're scrambling, settling, or showing up in something that's fine but not right.</p>
          </div>
        </div>
      </div>
    </FadeInOnScroll>
  </section>
);
