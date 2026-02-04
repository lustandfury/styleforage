import type { Handler, HandlerEvent } from '@netlify/functions';
import { getStorage } from './lib/storage';

type Season = 'spring' | 'summer' | 'fall' | 'winter';

interface Lookbook {
  id: string;
  slug: string;
  clientName: string;
  title?: string;
  description?: string;
  passcode: string;
  season?: Season;
  createdAt: string;
}

/**
 * CMS Auth - Validates passcodes for admin and view access
 * POST /api/cms-auth
 * Body: { passcode: string, type: 'admin' | 'view', slug?: string }
 * 
 * For admin: validates against ADMIN_PASSCODE env var
 * For view: validates against the specific lookbook's passcode (requires slug)
 */
const handler: Handler = async (event: HandlerEvent) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { passcode, type, slug } = body;

    if (!passcode || typeof passcode !== 'string') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Passcode is required' }),
      };
    }

    if (type !== 'admin' && type !== 'view') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Type must be "admin" or "view"' }),
      };
    }

    // Admin authentication - uses env var
    if (type === 'admin') {
      const adminPasscode = process.env.ADMIN_PASSCODE;
      
      if (!adminPasscode) {
        console.error('ADMIN_PASSCODE is not configured');
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Admin access not configured' }),
        };
      }

      if (passcode === adminPasscode) {
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: true, type: 'admin' }),
        };
      }

      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid passcode' }),
      };
    }

    // View authentication - uses lookbook-specific passcode
    if (type === 'view') {
      if (!slug || typeof slug !== 'string') {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Lookbook slug is required for view access' }),
        };
      }

      // Get lookbooks to find the passcode
      const store = getStorage('cms-editorial');
      const lookbooksData = await store.get('lookbooks', { type: 'json' });
      const lookbooks: Lookbook[] = lookbooksData || [];

      const lookbook = lookbooks.find(l => l.slug === slug);
      
      if (!lookbook) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Lookbook not found' }),
        };
      }

      if (passcode === lookbook.passcode) {
        // Find all lookbooks with the same passcode (for season switching)
        const relatedLookbooks = lookbooks
          .filter(l => l.passcode === lookbook.passcode)
          .map(l => ({
            slug: l.slug,
            clientName: l.clientName,
            season: l.season,
          }))
          .sort((a, b) => {
            // Sort by season order: spring, summer, fall, winter
            const seasonOrder: Record<string, number> = { spring: 0, summer: 1, fall: 2, winter: 3 };
            const aOrder = a.season ? seasonOrder[a.season] ?? 4 : 4;
            const bOrder = b.season ? seasonOrder[b.season] ?? 4 : 4;
            return aOrder - bOrder;
          });

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            success: true, 
            type: 'view',
            lookbook: {
              slug: lookbook.slug,
              clientName: lookbook.clientName,
              title: lookbook.title,
              description: lookbook.description,
              season: lookbook.season,
            },
            relatedLookbooks,
          }),
        };
      }

      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid passcode' }),
      };
    }

    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Invalid passcode' }),
    };
  } catch (error) {
    console.error('Auth error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Authentication failed' }),
    };
  }
};

export { handler };
