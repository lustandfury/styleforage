import type { Handler, HandlerEvent } from '@netlify/functions';
import { getStorage } from './lib/storage';

export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  favicon?: string;
}

export interface ShoppingLink {
  id: string;
  url: string;
  title?: string;
  description?: string;
  linkPreview?: LinkPreview;
  checked: boolean;
  order: number;
  createdAt: string;
}

interface Lookbook {
  id: string;
  slug: string;
  clientName: string;
  passcode: string;
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
 * Validate admin passcode
 */
function isAdminValid(event: HandlerEvent): boolean {
  const adminPasscode = event.headers['x-admin-passcode'];
  const envAdminPasscode = process.env.ADMIN_PASSCODE;
  return !!(adminPasscode && envAdminPasscode && adminPasscode === envAdminPasscode);
}

/**
 * Validate view passcode for a specific lookbook
 */
async function isViewValid(event: HandlerEvent, slug: string): Promise<boolean> {
  const viewPasscode = event.headers['x-view-passcode'];
  if (!viewPasscode) return false;

  const store = getStorage('cms-editorial');
  const lookbooksData = await store.get('lookbooks', { type: 'json' });
  const lookbooks: Lookbook[] = (lookbooksData as Lookbook[]) || [];
  const lookbook = lookbooks.find(l => l.slug === slug);

  return !!(lookbook && viewPasscode === lookbook.passcode);
}

/**
 * CMS Links - Manage shopping links for a lookbook
 * GET /api/cms-links?slug=xxx - List all links (admin or view passcode)
 * POST /api/cms-links - Create new link (admin only)
 * PATCH /api/cms-links - Update link (admin only)
 * DELETE /api/cms-links?slug=xxx&id=yyy - Delete link (admin only)
 */
const handler: Handler = async (event: HandlerEvent) => {
  const store = getStorage('cms-editorial');

  try {
    const slug = event.queryStringParameters?.slug || 
                 (event.body ? JSON.parse(event.body).slug : null);

    if (!slug) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Lookbook slug is required' }),
      };
    }

    // GET - List shopping links (admin or view access)
    if (event.httpMethod === 'GET') {
      const isAdmin = isAdminValid(event);
      const isViewer = await isViewValid(event, slug);

      if (!isAdmin && !isViewer) {
        return {
          statusCode: 401,
          body: JSON.stringify({ error: 'Unauthorized' }),
        };
      }

      const linksData = await store.get(`links/${slug}`, { type: 'json' });
      const links: ShoppingLink[] = (linksData as ShoppingLink[]) || [];

      // Sort by order
      links.sort((a, b) => a.order - b.order);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(links),
      };
    }

    // PATCH for checked status can be done by viewers
    if (event.httpMethod === 'PATCH') {
      const body = JSON.parse(event.body || '{}');
      const { id, checked } = body;

      // Check if this is a viewer-allowed update (only checked field)
      const isAdmin = isAdminValid(event);
      const isViewer = await isViewValid(event, slug);

      if (!isAdmin && !isViewer) {
        return {
          statusCode: 401,
          body: JSON.stringify({ error: 'Unauthorized' }),
        };
      }

      if (!id || typeof id !== 'string') {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Link ID is required' }),
        };
      }

      // Read current links
      const linksData = await store.get(`links/${slug}`, { type: 'json' });
      const links: ShoppingLink[] = (linksData as ShoppingLink[]) || [];

      // Find the link
      const linkIndex = links.findIndex(l => l.id === id);
      if (linkIndex === -1) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Link not found' }),
        };
      }

      // Viewers can only update checked status
      if (!isAdmin) {
        if (checked !== undefined) {
          links[linkIndex].checked = checked;
        }
        await store.setJSON(`links/${slug}`, links);
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(links[linkIndex]),
        };
      }

      // Admin can update all fields
      const { url, title, description, linkPreview, order } = body;

      if (url !== undefined) links[linkIndex].url = url.trim();
      if (title !== undefined) links[linkIndex].title = title?.trim() || undefined;
      if (description !== undefined) links[linkIndex].description = description?.trim() || undefined;
      if (linkPreview !== undefined) links[linkIndex].linkPreview = linkPreview || undefined;
      if (checked !== undefined) links[linkIndex].checked = checked;
      if (order !== undefined && typeof order === 'number') links[linkIndex].order = order;

      await store.setJSON(`links/${slug}`, links);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(links[linkIndex]),
      };
    }

    // All other operations require admin
    if (!isAdminValid(event)) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    // POST - Create new link
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { url, title, description, linkPreview } = body;

      if (!url || typeof url !== 'string' || url.trim().length === 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'URL is required' }),
        };
      }

      // Read current links
      const linksData = await store.get(`links/${slug}`, { type: 'json' });
      const links: ShoppingLink[] = (linksData as ShoppingLink[]) || [];

      // Create new link
      const newLink: ShoppingLink = {
        id: generateId(),
        url: url.trim(),
        title: title?.trim() || undefined,
        description: description?.trim() || undefined,
        linkPreview: linkPreview || undefined,
        checked: false,
        order: links.length,
        createdAt: new Date().toISOString(),
      };

      links.push(newLink);
      await store.setJSON(`links/${slug}`, links);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLink),
      };
    }

    // DELETE - Delete link
    if (event.httpMethod === 'DELETE') {
      const id = event.queryStringParameters?.id;

      if (!id) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Link ID is required' }),
        };
      }

      // Read current links
      const linksData = await store.get(`links/${slug}`, { type: 'json' });
      const links: ShoppingLink[] = (linksData as ShoppingLink[]) || [];

      // Find the link
      const linkIndex = links.findIndex(l => l.id === id);
      if (linkIndex === -1) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Link not found' }),
        };
      }

      // Remove the link
      links.splice(linkIndex, 1);

      // Reorder remaining links
      links.forEach((link, i) => {
        link.order = i;
      });

      await store.setJSON(`links/${slug}`, links);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, id }),
      };
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Shopping links error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process request' }),
    };
  }
};

export { handler };
