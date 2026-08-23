import { SERVICES } from '../data/services.ts';

/**
 * Single source of truth for the site's public, indexable routes.
 * Used by both the sitemap generator and the prerender script so they can never drift.
 */
export function getPublicRoutes() {
  return [
    { path: '/', priority: 1.0, changefreq: 'weekly' },
    { path: '/contact', priority: 0.9, changefreq: 'monthly' },
    ...SERVICES.map((service) => ({
      path: `/book/${service.id}`,
      priority: 0.8,
      changefreq: 'monthly',
    })),
  ];
}
