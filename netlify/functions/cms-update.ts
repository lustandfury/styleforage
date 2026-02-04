import type { Handler, HandlerEvent } from '@netlify/functions';
import { getStorage } from './lib/storage';

type Season = 'spring' | 'summer' | 'fall' | 'winter';

interface EditorialEntry {
  id: string;
  imageKey: string;
  caption: string;
  order: number;
  createdAt: string;
  season?: Season;
}

/**
 * CMS Update - Update caption or order of an entry in a specific lookbook
 * PATCH /api/cms-update
 * Headers: X-Admin-Passcode
 * Body: { slug: string, id: string, caption?: string, order?: number }
 */
const handler: Handler = async (event: HandlerEvent) => {
  // Only allow PATCH requests
  if (event.httpMethod !== 'PATCH') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Validate admin passcode
    const adminPasscode = event.headers['x-admin-passcode'];
    const envAdminPasscode = process.env.ADMIN_PASSCODE;

    if (!adminPasscode || !envAdminPasscode || adminPasscode !== envAdminPasscode) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { slug, id, caption, order, season } = body;

    if (!slug || typeof slug !== 'string') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Lookbook slug is required' }),
      };
    }

    if (!id || typeof id !== 'string') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Entry ID is required' }),
      };
    }

    // Get the editorial store
    const store = getStorage('cms-editorial');
    
    // Read current entries for this lookbook
    const entriesData = await store.get(`entries/${slug}`, { type: 'json' });
    const entries: EditorialEntry[] = entriesData || [];

    // Find the entry
    const entryIndex = entries.findIndex(e => e.id === id);
    if (entryIndex === -1) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Entry not found' }),
      };
    }

    // Update fields
    if (caption !== undefined) {
      entries[entryIndex].caption = caption;
    }
    if (order !== undefined && typeof order === 'number') {
      entries[entryIndex].order = order;
    }
    if (season !== undefined) {
      if (season === null || season === '') {
        delete entries[entryIndex].season;
      } else {
        entries[entryIndex].season = season as Season;
      }
    }

    // Save updated entries
    await store.setJSON(`entries/${slug}`, entries);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entries[entryIndex]),
    };
  } catch (error) {
    console.error('Update error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to update entry' }),
    };
  }
};

export { handler };
