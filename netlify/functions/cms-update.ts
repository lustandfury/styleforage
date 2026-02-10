import type { Handler, HandlerEvent } from '@netlify/functions';
import { getStorage } from './lib/storage';
import { normalizePastedText } from './lib/text';
import { isAdminValid } from './lib/auth';

type Season = 'spring' | 'summer' | 'fall' | 'winter';

interface EditorialEntry {
  id: string;
  imageKey: string;
  title?: string;
  caption: string;
  order: number;
  createdAt: string;
  season?: Season;
}

/**
 * CMS Update - Update title, caption or order of an entry in a specific lookbook
 * PATCH /api/cms-update
 * Headers: X-Admin-Passcode
 * Body: { slug: string, id: string, title?: string, caption?: string, order?: number }
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
    if (!isAdminValid(event)) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { slug, id, title, caption, order, season } = body;

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
    const store = getStorage('cms-editorial', event);

    // Read current entries to validate existence
    const entriesData = await store.get(`entries/${slug}`, { type: 'json' });
    const entries: EditorialEntry[] = Array.isArray(entriesData) ? entriesData as EditorialEntry[] : [];

    // Find the entry
    const entryIndex = entries.findIndex(e => e.id === id);
    if (entryIndex === -1) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Entry not found' }),
      };
    }

    // Build the desired state for this entry
    const updatedEntry: EditorialEntry = { ...entries[entryIndex] };
    if (title !== undefined) {
      if (title === null || title === '') {
        delete updatedEntry.title;
      } else if (typeof title === 'string') {
        updatedEntry.title = title.trim();
      }
    }
    if (caption !== undefined) {
      updatedEntry.caption = normalizePastedText(caption);
    }
    if (order !== undefined && typeof order === 'number') {
      updatedEntry.order = order;
    }
    if (season !== undefined) {
      if (season === null || season === '') {
        delete updatedEntry.season;
      } else {
        updatedEntry.season = season as Season;
      }
    }

    // Re-read latest before write to avoid overwriting concurrent changes to other entries
    const latestData = await store.get(`entries/${slug}`, { type: 'json' });
    const latest: EditorialEntry[] = Array.isArray(latestData) ? latestData as EditorialEntry[] : [];
    const latestIndex = latest.findIndex(e => e.id === id);
    if (latestIndex === -1) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Entry not found' }) };
    }
    latest[latestIndex] = updatedEntry;
    await store.setJSON(`entries/${slug}`, latest);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedEntry),
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
