import type { Handler, HandlerEvent } from '@netlify/functions';
import { getStorage } from './lib/storage';

interface EditorialEntry {
  id: string;
  imageKey: string;
  caption: string;
  order: number;
  createdAt: string;
}

/**
 * CMS Delete - Delete an editorial entry and its image from a specific lookbook
 * DELETE /api/cms-delete?slug=xxx&id=yyy
 * Headers: X-Admin-Passcode
 */
const handler: Handler = async (event: HandlerEvent) => {
  // Only allow DELETE requests
  if (event.httpMethod !== 'DELETE') {
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

    // Get slug and ID from query params
    const slug = event.queryStringParameters?.slug;
    const id = event.queryStringParameters?.id;

    if (!slug) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Lookbook slug is required' }),
      };
    }

    if (!id) {
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

    const entry = entries[entryIndex];

    // Delete the image blob
    await store.delete(entry.imageKey);

    // Remove from entries
    entries.splice(entryIndex, 1);

    // Reorder remaining entries
    entries.forEach((e, i) => {
      e.order = i;
    });

    // Save updated entries
    await store.setJSON(`entries/${slug}`, entries);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, id }),
    };
  } catch (error) {
    console.error('Delete error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to delete entry' }),
    };
  }
};

export { handler };
