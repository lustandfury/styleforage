import type { Handler, HandlerEvent } from '@netlify/functions';

const DEFAULT_MANIFEST = {
  name: 'Style Forage Lookbook',
  short_name: 'Style Forage',
  description: 'Your personalized style lookbook by Roz',
  start_url: '/',
  display: 'standalone',
  background_color: '#FAF9F7',
  theme_color: '#1c1917',
  orientation: 'portrait-primary',
  icons: [
    { src: '/images/favicon.png', sizes: '32x32', type: 'image/png' },
    { src: '/images/app-icon.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
  ],
} as const;

/**
 * Serves the PWA manifest with an optional lookbook start_url.
 * GET /manifest.json         -> start_url: "/"
 * GET /manifest.json?slug=xx -> start_url: "/lookbook/xx"
 * Used so "Add to Home Screen" from a lookbook page opens that lookbook.
 */
const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const slug = event.queryStringParameters?.slug?.trim();
  const startUrl = slug ? `/lookbook/${encodeURIComponent(slug)}` : '/';

  const manifest = {
    ...DEFAULT_MANIFEST,
    start_url: startUrl,
  };

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=0',
    },
    body: JSON.stringify(manifest),
  };
};

export { handler };
