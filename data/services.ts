import type { Service } from '../types';

/**
 * Single source of truth for service content (price, features, descriptions, images).
 * Used by the home page service cards (Services.tsx) and the booking flow (BookingWizard.tsx).
 */
export const SERVICES: Service[] = [
  {
    id: 'closet-edit',
    title: 'The Closet Edit',
    description:
      "A thoughtful review of your clothes, focused on fit, comfort, and relevance. We go through your wardrobe piece by piece, identify what works and what doesn't, and build a clear edit so you get more wear from fewer pieces and get dressed with confidence.",
    longDescription:
      "You don't need to overhaul your entire wardrobe—you need a fresh perspective on the one you already have. A Closet Edit is a thoughtful review of your clothes, focused on fit, comfort, and relevance. We edit out pieces that no longer work, create new outfits from what you already own, and pinpoint the missing pieces that will help your wardrobe feel complete and modern.",
    features: [
      'Review of fit, comfort, and current style',
      'Editing items that no longer work',
      'Creating new outfits from existing pieces',
      'Pinpointing wardrobe gaps',
      'Fresh perspective on your style',
    ],
    price: 350,
    durationMin: 150,
    image: '/images/services/closet-edit.webp',
  },
  {
    id: 'full-style-reset',
    title: 'The Full Style Reset Package',
    description: 'For clients ready for a meaningful refresh and a wardrobe that feels aligned.',
    longDescription:
      'Combines The Closet Edit and Personal Shop. This is for clients ready for a meaningful refresh and a wardrobe that feels aligned, confident, and wearable. We start by clearing the noise and finish by intentionally filling the gaps.',
    features: [
      'Full Closet Edit session',
      'Personal Shopping session (In-person or Online)',
      'Style integration',
      'Complete wardrobe alignment',
      'Confidence building',
    ],
    price: 750,
    durationMin: 300,
    image: '/images/services/style-reset.webp',
  },
  {
    id: 'style-refresh',
    title: 'The Style Refresh',
    description: 'A focused update for a season, event, trip, or life change.',
    longDescription:
      'A focused update for a season, event, trip, or life change. Ideal if you want a vacation wardrobe, a seasonal update, or a workwear refresh.',
    features: [
      'In-person or Online Shopping recommendations',
      'Vacation wardrobe curation',
      'Seasonal updates',
      'Workwear refresh',
      'Event specific styling',
      'Targeted focus',
    ],
    price: 375,
    durationMin: 120,
    image: '/images/services/style-refresh.webp',
  },
  {
    id: 'personal-shop',
    title: 'Personal Shop',
    description: "Intentional shopping, guided by fit, comfort, and what's current.",
    longDescription:
      "Intentional shopping, guided by fit, comfort, and what's current. Available as an In-person shop or Online shop. Best paired with a Closet Edit.",
    features: [
      'In-person or Online options',
      'Targeted shopping list',
      'Budget management',
    ],
    price: 350,
    durationMin: 180,
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'corporate-workshops',
    title: 'Corporate Style Workshops',
    description:
      'Practical style talks for teams so everyone can show up with confidence and consistency. Sessions cover dress codes, building a work-ready capsule, and small tweaks that make a big impact—tailored to your company culture and goals.',
    longDescription:
      'I offer style talks for teams who want to show up with confidence and consistency—individually and as a brand. Talks are practical, inclusive, and tailored to your organization.',
    features: [
      'Tailored to your organization',
      'Inclusive & practical advice',
      'Focus on professional image',
      'Amplifying brand presence',
      'Interactive Q&A',
    ],
    price: 625,
    durationMin: 60,
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
  },
];
