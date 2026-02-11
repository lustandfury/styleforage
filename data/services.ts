import type { Service } from '../types';

/**
 * Single source of truth for service content (price, features, descriptions, images).
 * Used by the home page service cards (Services.tsx) and the booking flow (BookingWizard.tsx).
 */
export const SERVICES: Service[] = [
  {
    id: 'style-upgrade',
    title: 'The Complete Style Upgrade',
    badge: 'Most Popular',
    combo: 'Closet Edit + Personal Shop',
    description:
      'The Closet Edit + Personal Shop. The full process — we edit your wardrobe in person, then fill the gaps with a curated shop, online or in-store.',
    longDescription:
      'Instead of simply knowing what\'s missing — it gets handled. The closet edit is always in-home. The shop can be done online or in-person.',
    features: [
      'Closet Edit (3-hour in-home session)',
      'Gap strategy and prioritized plan',
      'Personalized selection (8–15 pieces)',
      'Outfit integration guidance',
      'Minor adjustments if sizing or availability requires',
    ],
    price: 850,
    priceVariants: { online: 850, inPerson: 1000 },
    variantDescriptions: {
      online:
        'Closet edit at your home + personal shopping done remotely. You receive a curated selection of 8–15 pieces with outfit integration guidance and minor adjustments as needed.',
      inPerson:
        'Closet edit at your home + we shop together in-store. Pre-curated selection, 2–3 hours of real-time styling and fit guidance.',
    },
    durationMin: 300,
    image: '/images/services/style-reset.webp',
  },
  {
    id: 'closet-reset',
    title: 'The Closet Edit',
    description:
      'A strategic, in-home wardrobe edit designed to help you see what you already own differently — and build real outfits from it.',
    longDescription:
      'We refine what stays, identify what\'s missing, and create complete combinations so getting dressed feels simple again. Additional time, if required: $100/hour.',
    features: [
      '3-hour in-home session',
      'Edited wardrobe decisions (keep / tailor / release)',
      'Styled outfits created during the session',
      'Quick reference photos',
      'Written gap list with prioritized next steps',
    ],
    price: 575,
    durationMin: 180,
    image: '/images/services/closet-edit.webp',
  },
  {
    id: 'style-refresh',
    title: 'The Style Refresh',
    description:
      'For travel, events, seasonal updates, or focused wardrobe additions. No full closet edit required.',
    longDescription:
      'Ideal for weddings, vacations, speaking engagements, or a targeted reset.',
    features: [
      '30-minute clarity call',
      'Curated selection aligned to your needs (8–15 pieces)',
      'Outfit pairing guidance',
      'Minor adjustments if needed',
    ],
    price: 350,
    priceVariants: { online: 350, inPerson: 500 },
    variantDescriptions: {
      online:
        'We work together remotely with a curated selection and links; you shop on your timeline with pairing guidance and minor adjustments as needed.',
      inPerson:
        'We meet in-store with a pre-curated selection; you try pieces on and get real-time styling and fit guidance.',
    },
    durationMin: 120,
    image: '/images/services/style-refresh.webp',
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
