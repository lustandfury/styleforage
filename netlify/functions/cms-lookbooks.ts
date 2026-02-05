import type { Handler, HandlerEvent } from '@netlify/functions';
import { getStorage } from './lib/storage';

export type Season = 'spring' | 'summer' | 'fall' | 'winter';

export interface Lookbook {
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
 * Generate a simple UUID v4
 */
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate a random 4-digit passcode (0000–9999)
 */
function generatePasscode(): string {
  return Math.floor(Math.random() * 10000).toString().padStart(4, '0');
}

/**
 * Convert client name to URL-safe slug
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .substring(0, 50); // Limit length
}

/**
 * Validate admin passcode
 */
function isAdminValid(event: HandlerEvent): boolean {
  const adminPasscode = event.headers['x-admin-passcode'];
  const envAdminPasscode = process.env.ADMIN_PASSCODE;
  return !!(adminPasscode && envAdminPasscode && adminPasscode === envAdminPasscode);
}

/**
 * CMS Lookbooks - Manage client lookbooks
 * GET /api/cms-lookbooks - List all lookbooks (admin only)
 * POST /api/cms-lookbooks - Create new lookbook (admin only)
 * DELETE /api/cms-lookbooks?slug=xxx - Delete a lookbook (admin only)
 */
const handler: Handler = async (event: HandlerEvent) => {
  // Validate admin passcode for all operations
  if (!isAdminValid(event)) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' }),
    };
  }

  const store = getStorage('cms-editorial', event);

  try {
    // GET - List all lookbooks
    if (event.httpMethod === 'GET') {
      const lookbooksData = await store.get('lookbooks', { type: 'json' });
      const lookbooks: Lookbook[] = lookbooksData || [];
      
      // Sort by creation date (newest first)
      lookbooks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lookbooks),
      };
    }

    // POST - Create new lookbook
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { clientName, title, description, season } = body;

      if (!clientName || typeof clientName !== 'string' || clientName.trim().length === 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Client name is required' }),
        };
      }

      // Validate season
      const validSeasons: Season[] = ['spring', 'summer', 'fall', 'winter'];
      const lookbookSeason: Season | undefined = validSeasons.includes(season) ? season : undefined;

      // Generate slug from client name
      let slug = slugify(clientName);
      
      // Get existing lookbooks
      const lookbooksData = await store.get('lookbooks', { type: 'json' });
      const lookbooks: Lookbook[] = lookbooksData || [];

      // Ensure slug is unique
      const existingSlugs = new Set(lookbooks.map(l => l.slug));
      let uniqueSlug = slug;
      let counter = 1;
      while (existingSlugs.has(uniqueSlug)) {
        uniqueSlug = `${slug}-${counter}`;
        counter++;
      }
      slug = uniqueSlug;

      // Create new lookbook
      const newLookbook: Lookbook = {
        id: generateId(),
        slug,
        clientName: clientName.trim(),
        title: title?.trim() || undefined,
        description: description?.trim() || undefined,
        passcode: generatePasscode(),
        season: lookbookSeason,
        createdAt: new Date().toISOString(),
      };

      // Add to lookbooks list
      lookbooks.push(newLookbook);
      await store.setJSON('lookbooks', lookbooks);

      // Initialize empty entries for this lookbook
      await store.setJSON(`entries/${slug}`, []);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLookbook),
      };
    }

    // PATCH - Update a lookbook
    if (event.httpMethod === 'PATCH') {
      const body = JSON.parse(event.body || '{}');
      const { slug, title, description, season } = body;

      if (!slug) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Lookbook slug is required' }),
        };
      }

      // Get lookbooks
      const lookbooksData = await store.get('lookbooks', { type: 'json' });
      const lookbooks: Lookbook[] = lookbooksData || [];

      // Find the lookbook
      const lookbookIndex = lookbooks.findIndex(l => l.slug === slug);
      if (lookbookIndex === -1) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Lookbook not found' }),
        };
      }

      // Update fields
      if (title !== undefined) {
        lookbooks[lookbookIndex].title = title?.trim() || undefined;
      }
      if (description !== undefined) {
        lookbooks[lookbookIndex].description = description?.trim() || undefined;
      }
      if (season !== undefined) {
        const validSeasons: Season[] = ['spring', 'summer', 'fall', 'winter'];
        lookbooks[lookbookIndex].season = validSeasons.includes(season) ? season : undefined;
      }

      await store.setJSON('lookbooks', lookbooks);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lookbooks[lookbookIndex]),
      };
    }

    // DELETE - Delete a lookbook
    if (event.httpMethod === 'DELETE') {
      const slug = event.queryStringParameters?.slug;

      if (!slug) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Lookbook slug is required' }),
        };
      }

      // Get lookbooks
      const lookbooksData = await store.get('lookbooks', { type: 'json' });
      const lookbooks: Lookbook[] = lookbooksData || [];

      // Find the lookbook
      const lookbookIndex = lookbooks.findIndex(l => l.slug === slug);
      if (lookbookIndex === -1) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Lookbook not found' }),
        };
      }

      // Get entries to delete their images
      const entriesData = await store.get(`entries/${slug}`, { type: 'json' });
      const entries: { imageKey: string; imageKeys?: string[] }[] = entriesData || [];

      for (const entry of entries) {
        const keys = (entry.imageKeys && entry.imageKeys.length > 0) ? entry.imageKeys : [entry.imageKey];
        for (const key of keys) {
          try {
            await store.delete(key);
          } catch {
            // Ignore errors deleting individual images
          }
        }
      }

      // Delete entries index
      await store.delete(`entries/${slug}`);

      // Remove from lookbooks list
      lookbooks.splice(lookbookIndex, 1);
      await store.setJSON('lookbooks', lookbooks);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, slug }),
      };
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Lookbooks error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process request' }),
    };
  }
};

export { handler };
