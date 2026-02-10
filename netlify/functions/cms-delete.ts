import type { Handler, HandlerEvent } from '@netlify/functions';
import { getStorage } from './lib/storage';
import { isAdminValid } from './lib/auth';

interface EditorialEntry {
  id: string;
  imageKey: string;
  imageKeys?: string[];
  title?: string;
  caption: string;
  order: number;
  createdAt: string;
}

/**
 * CMS Delete - Delete an editorial entry (and all its images) or a single image from an entry
 * DELETE /api/cms-delete?slug=xxx&id=yyy - Delete whole entry
 * DELETE /api/cms-delete?slug=xxx&id=yyy&key=images/xxx - Delete one image from entry
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
    if (!isAdminValid(event)) {
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
    const store = getStorage('cms-editorial', event);
    
    // Read current entries for this lookbook
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

    const entry = entries[entryIndex];
    const keyToDelete = event.queryStringParameters?.key;

    // Delete a single image from this entry
    if (keyToDelete) {
      const keys = (entry.imageKeys && entry.imageKeys.length > 0) ? entry.imageKeys : [entry.imageKey];
      if (!keys.includes(keyToDelete)) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Image not found in entry' }),
        };
      }
      try {
        await store.delete(keyToDelete);
      } catch {
        // Ignore blob delete errors
      }
      const newKeys = keys.filter(k => k !== keyToDelete);
      let updatedEntries: EditorialEntry[];
      if (newKeys.length === 0) {
        updatedEntries = entries.filter((_, i) => i !== entryIndex);
        updatedEntries.forEach((e, i) => { e.order = i; });
      } else {
        updatedEntries = entries.map((e, i) =>
          i === entryIndex
            ? { ...e, imageKeys: newKeys, imageKey: newKeys[0] }
            : e
        );
      }
      try {
        await store.setJSON(`entries/${slug}`, updatedEntries);
      } catch (persistError) {
        console.error('cms-delete: failed to persist entries after image delete', persistError);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to save changes after deleting image' }),
        };
      }
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, id, key: keyToDelete }),
      };
    }

    // Delete whole entry and all its image blobs
    const keysToDelete = (entry.imageKeys && entry.imageKeys.length > 0) ? entry.imageKeys : [entry.imageKey];
    for (const key of keysToDelete) {
      try {
        await store.delete(key);
      } catch {
        // Ignore
      }
    }

    const updatedEntries = entries.filter((_, i) => i !== entryIndex);
    updatedEntries.forEach((e, i) => { e.order = i; });
    try {
      await store.setJSON(`entries/${slug}`, updatedEntries);
    } catch (persistError) {
      console.error('cms-delete: failed to persist entries after entry delete', persistError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to save changes after deleting entry' }),
      };
    }

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
