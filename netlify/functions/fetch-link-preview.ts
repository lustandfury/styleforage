import type { Handler, HandlerEvent } from '@netlify/functions';

interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  favicon?: string;
}

/**
 * Fetch Open Graph metadata from a URL
 * GET /api/fetch-link-preview?url=xxx
 * Headers: X-Admin-Passcode (admin only)
 */
const handler: Handler = async (event: HandlerEvent) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Validate admin passcode
  const adminPasscode = event.headers['x-admin-passcode'];
  const envAdminPasscode = process.env.ADMIN_PASSCODE;

  if (!adminPasscode || !envAdminPasscode || adminPasscode !== envAdminPasscode) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' }),
    };
  }

  const url = event.queryStringParameters?.url;

  if (!url) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'URL is required' }),
    };
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid URL format' }),
    };
  }

  try {
    // Fetch the URL with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; StyleForage/1.0; +https://styleforage.com)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, error: 'Failed to fetch URL' }),
      };
    }

    const html = await response.text();
    const preview = parseMetadata(html, url);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preview),
    };
  } catch (error) {
    console.error('Fetch link preview error:', error);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, error: 'Failed to fetch preview' }),
    };
  }
};

/**
 * Parse Open Graph and meta tags from HTML
 */
function parseMetadata(html: string, url: string): LinkPreview {
  const preview: LinkPreview = { url };

  // Helper to extract meta content
  const getMetaContent = (property: string): string | undefined => {
    // Try og: prefix
    const ogMatch = html.match(new RegExp(`<meta[^>]*property=["']og:${property}["'][^>]*content=["']([^"']*)["']`, 'i'))
      || html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:${property}["']`, 'i'));
    if (ogMatch) return decodeHtmlEntities(ogMatch[1]);

    // Try twitter: prefix
    const twitterMatch = html.match(new RegExp(`<meta[^>]*name=["']twitter:${property}["'][^>]*content=["']([^"']*)["']`, 'i'))
      || html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']twitter:${property}["']`, 'i'));
    if (twitterMatch) return decodeHtmlEntities(twitterMatch[1]);

    // Try standard meta name
    const nameMatch = html.match(new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i'))
      || html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${property}["']`, 'i'));
    if (nameMatch) return decodeHtmlEntities(nameMatch[1]);

    return undefined;
  };

  // Extract title
  preview.title = getMetaContent('title');
  if (!preview.title) {
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    if (titleMatch) preview.title = decodeHtmlEntities(titleMatch[1].trim());
  }

  // Extract description
  preview.description = getMetaContent('description');

  // Extract image
  preview.image = getMetaContent('image');
  if (preview.image) {
    // Make relative URL absolute and ensure HTTPS
    try {
      const baseUrl = new URL(url);
      let imageUrl = preview.image;
      
      // Convert to absolute URL if relative
      if (!imageUrl.startsWith('http')) {
        imageUrl = new URL(imageUrl, baseUrl.origin).href;
      }
      
      // Ensure HTTPS protocol
      if (imageUrl.startsWith('http://')) {
        imageUrl = imageUrl.replace('http://', 'https://');
      }
      
      preview.image = imageUrl;
    } catch {
      // Ignore invalid URLs
    }
  }

  // Extract site name
  preview.siteName = getMetaContent('site_name');
  if (!preview.siteName) {
    try {
      preview.siteName = new URL(url).hostname.replace('www.', '');
    } catch {
      // Ignore
    }
  }

  // Extract favicon
  const faviconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']*)["']/i)
    || html.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["'](?:shortcut )?icon["']/i);
  if (faviconMatch) {
    let favicon = faviconMatch[1];
    try {
      const baseUrl = new URL(url);
      
      // Convert to absolute URL if relative
      if (!favicon.startsWith('http')) {
        favicon = new URL(favicon, baseUrl.origin).href;
      }
      
      // Ensure HTTPS protocol
      if (favicon.startsWith('http://')) {
        favicon = favicon.replace('http://', 'https://');
      }
      
      preview.favicon = favicon;
    } catch {
      // Default to /favicon.ico with HTTPS
      try {
        const baseUrl = new URL(url);
        preview.favicon = `${baseUrl.origin.replace('http://', 'https://')}/favicon.ico`;
      } catch {
        // Ignore
      }
    }
  } else {
    // Default to /favicon.ico with HTTPS
    try {
      const baseUrl = new URL(url);
      preview.favicon = `${baseUrl.origin.replace('http://', 'https://')}/favicon.ico`;
    } catch {
      // Ignore
    }
  }

  return preview;
}

/**
 * Decode HTML entities
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&#x([a-fA-F0-9]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

export { handler };
