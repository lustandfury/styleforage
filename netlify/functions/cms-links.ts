import type { Handler, HandlerEvent } from '@netlify/functions';
import { getStorage } from './lib/storage';
import { generateId, isAdminValid, isViewValid } from './lib/auth';

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

/**
 * CMS Links - Manage shopping links for a lookbook
 * GET /api/cms-links?slug=xxx - List all links (admin or view passcode)
 * POST /api/cms-links - Create new link (admin only)
 * PATCH /api/cms-links - Update link (admin only)
 * DELETE /api/cms-links?slug=xxx&id=yyy - Delete link (admin only)
 */
const handler: Handler = async (event: HandlerEvent) => {
  const store = getStorage('cms-editorial', event);

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
      const links: ShoppingLink[] = Array.isArray(linksData) ? linksData as ShoppingLink[] : [];

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

      // Read current links to validate existence
      const linksData = await store.get(`links/${slug}`, { type: 'json' });
      const links: ShoppingLink[] = Array.isArray(linksData) ? linksData as ShoppingLink[] : [];

      // Find the link
      const linkIndex = links.findIndex(l => l.id === id);
      if (linkIndex === -1) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Link not found' }),
        };
      }

      if (!isAdmin) {
        // Viewer: only checked — build updated link and re-read before write
        const updatedLink: ShoppingLink = { ...links[linkIndex] };
        if (checked !== undefined) updatedLink.checked = checked;

        const latestData = await store.get(`links/${slug}`, { type: 'json' });
        const latest: ShoppingLink[] = Array.isArray(latestData) ? latestData as ShoppingLink[] : [];
        const latestIndex = latest.findIndex(l => l.id === id);
        if (latestIndex === -1) {
          return { statusCode: 404, body: JSON.stringify({ error: 'Link not found' }) };
        }
        latest[latestIndex] = updatedLink;
        await store.setJSON(`links/${slug}`, latest);
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedLink),
        };
      }

      // Admin: build desired state for this link
      const { url, title, description, linkPreview, order } = body;
      const updatedLink: ShoppingLink = { ...links[linkIndex] };

      if (url !== undefined) updatedLink.url = url.trim();
      if (title !== undefined) updatedLink.title = title?.trim() || undefined;
      if (description !== undefined) updatedLink.description = description?.trim() || undefined;
      if (linkPreview !== undefined) updatedLink.linkPreview = linkPreview || undefined;
      if (checked !== undefined) updatedLink.checked = checked;
      if (order !== undefined && typeof order === 'number') updatedLink.order = order;

      // Re-read latest before write to avoid overwriting concurrent changes
      const latestData = await store.get(`links/${slug}`, { type: 'json' });
      const latest: ShoppingLink[] = Array.isArray(latestData) ? latestData as ShoppingLink[] : [];
      const latestIndex = latest.findIndex(l => l.id === id);
      if (latestIndex === -1) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Link not found' }) };
      }
      latest[latestIndex] = updatedLink;
      await store.setJSON(`links/${slug}`, latest);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedLink),
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

      // Read current links for order calculation
      const linksData = await store.get(`links/${slug}`, { type: 'json' });
      const links: ShoppingLink[] = Array.isArray(linksData) ? linksData as ShoppingLink[] : [];

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

      // Re-read before write to avoid losing concurrent adds
      const latestData = await store.get(`links/${slug}`, { type: 'json' });
      const latest: ShoppingLink[] = Array.isArray(latestData) ? latestData as ShoppingLink[] : [];
      const merged = latest.some(l => l.id === newLink.id) ? latest : [...latest, newLink];
      if (merged.length !== latest.length) {
        merged[merged.length - 1].order = merged.length - 1;
      }
      await store.setJSON(`links/${slug}`, merged);

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

      // Re-read latest data immediately before write to avoid overwriting concurrent changes
      const latestData = await store.get(`links/${slug}`, { type: 'json' });
      const latest: ShoppingLink[] = Array.isArray(latestData) ? latestData as ShoppingLink[] : [];
      const filtered = latest.filter(l => l.id !== id);
      if (filtered.length === latest.length) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Link not found' }),
        };
      }

      filtered.forEach((link, i) => { link.order = i; });
      await store.setJSON(`links/${slug}`, filtered);

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
