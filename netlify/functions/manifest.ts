import type { Handler, HandlerEvent } from '@netlify/functions';

const BASE_MANIFEST = {
  display: 'standalone',
  background_color: '#FAF9F7',
  theme_color: '#1c1917',
  orientation: 'portrait-primary',
  icons: [
    { src: '/images/favicon.png', sizes: '32x32', type: 'image/png' },
    { src: '/images/app-icon.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
  ],
} as const;

/** Get Referer from event (header name is case-insensitive) */
function getReferer(headers: Record<string, string | undefined>): string | undefined {
  const key = Object.keys(headers).find((k) => k.toLowerCase() === 'referer');
  return key ? headers[key] : headers.referer ?? headers.Referer;
}

/** Extract lookbook slug from Referer path (e.g. .../lookbook/lindsey-coulter -> lindsey-coulter) */
function slugFromReferer(referer: string | undefined): string | null {
  if (!referer) return null;
  try {
    const path = new URL(referer).pathname;
    const match = path.match(/^\/lookbook\/([^/?#]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Serves the PWA manifest with an optional lookbook start_url.
 * - Query ?slug=xx     -> start_url: "/lookbook/xx"
 * - Referer from /lookbook/xx -> start_url: "/lookbook/xx" (browser often fetches manifest with page URL as Referer)
 * - Otherwise          -> start_url: "/"
 * Used so "Install app" / Add to Home Screen from a lookbook page opens that lookbook.
 */
const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const slugFromQuery = event.queryStringParameters?.slug?.trim();
  const slugFromRef = slugFromReferer(getReferer(event.headers as Record<string, string | undefined>));
  const slug = slugFromQuery ?? slugFromRef ?? null;

  // Build manifest with lookbook-specific values if slug is present
  const startUrl = slug ? `/lookbook/${encodeURIComponent(slug)}` : '/';
  const scope = slug ? `/lookbook/${encodeURIComponent(slug)}` : '/';
  const id = slug ? `styleforage-lookbook-${slug}` : 'styleforage';
  const name = slug ? `Lookbook - ${slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}` : 'Style Forage Lookbook';
  const shortName = slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Style Forage';

  const manifest = {
    ...BASE_MANIFEST,
    id,
    name,
    short_name: shortName,
    description: 'Your personalized style lookbook by Roz',
    start_url: startUrl,
    scope,
  };

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'no-store, max-age=0',
      'Vary': 'Referer',
    },
    body: JSON.stringify(manifest),
  };
};

export { handler };
