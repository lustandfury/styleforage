import type { Handler, HandlerEvent } from '@netlify/functions';
import { getStorage } from './lib/storage';

type Season = 'spring' | 'summer' | 'fall' | 'winter';

export interface EditorialEntry {
  id: string;
  imageKey: string;
  caption: string;
  order: number;
  createdAt: string;
  season?: Season;
}

interface Lookbook {
  id: string;
  slug: string;
  clientName: string;
  passcode: string;
  createdAt: string;
}

/**
 * CMS List - Returns editorial entries for a specific lookbook
 * GET /api/cms-list?slug=xxx
 * Headers: X-Admin-Passcode or X-View-Passcode
 */
const handler: Handler = async (event: HandlerEvent) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const slug = event.queryStringParameters?.slug;

    if (!slug) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Lookbook slug is required' }),
      };
    }

    const store = getStorage('cms-editorial');

    // Check admin passcode first
    const adminPasscode = event.headers['x-admin-passcode'];
    const envAdminPasscode = process.env.ADMIN_PASSCODE;
    const isAdminValid = adminPasscode && envAdminPasscode && adminPasscode === envAdminPasscode;

    // If not admin, check view passcode for this specific lookbook
    if (!isAdminValid) {
      const viewPasscode = event.headers['x-view-passcode'];
      
      if (!viewPasscode) {
        return {
          statusCode: 401,
          body: JSON.stringify({ error: 'Unauthorized' }),
        };
      }

      // Get lookbook to verify passcode
      const lookbooksData = await store.get('lookbooks', { type: 'json' });
      const lookbooks: Lookbook[] = lookbooksData || [];
      const lookbook = lookbooks.find(l => l.slug === slug);

      if (!lookbook) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Lookbook not found' }),
        };
      }

      if (viewPasscode !== lookbook.passcode) {
        return {
          statusCode: 401,
          body: JSON.stringify({ error: 'Invalid passcode' }),
        };
      }
    }

    // Read the entries for this lookbook
    const entriesData = await store.get(`entries/${slug}`, { type: 'json' });
    const entries: EditorialEntry[] = entriesData || [];

    // Sort by order
    entries.sort((a, b) => a.order - b.order);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entries),
    };
  } catch (error) {
    console.error('List error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch entries' }),
    };
  }
};

export { handler };
