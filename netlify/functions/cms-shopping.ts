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

export type ShoppingCategory = 'tops' | 'bottoms' | 'accessories' | 'footwear' | 'outerwear' | 'uncategorized';

export interface ShoppingItemLink {
  url: string;
  description?: string;
  linkPreview?: LinkPreview;
}

export interface ShoppingItem {
  id: string;
  name: string;
  description?: string;
  link?: string;
  price?: string;
  linkPreview?: LinkPreview;
  /** Multiple product links (e.g. same item at different retailers). When set, link/linkPreview are derived from the first. */
  links?: ShoppingItemLink[];
  category: ShoppingCategory;
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

  const store = getStorage('cms-editorial', event);
  const lookbooksData = await store.get('lookbooks', { type: 'json' });
  const lookbooks: Lookbook[] = (lookbooksData as Lookbook[]) || [];
  const lookbook = lookbooks.find(l => l.slug === slug);

  return !!(lookbook && viewPasscode === lookbook.passcode);
}

/**
 * CMS Shopping - Manage shopping list items for a lookbook
 * GET /api/cms-shopping?slug=xxx - List all items (admin or view passcode)
 * POST /api/cms-shopping - Create new item (admin only)
 * PATCH /api/cms-shopping - Update item (admin only)
 * DELETE /api/cms-shopping?slug=xxx&id=yyy - Delete item (admin only)
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

    // GET - List shopping items (admin or view access)
    if (event.httpMethod === 'GET') {
      const isAdmin = isAdminValid(event);
      const isViewer = await isViewValid(event, slug);

      if (!isAdmin && !isViewer) {
        return {
          statusCode: 401,
          body: JSON.stringify({ error: 'Unauthorized' }),
        };
      }

      const itemsData = await store.get(`shopping/${slug}`, { type: 'json' });
      const items: ShoppingItem[] = (itemsData as ShoppingItem[]) || [];

      // Sort by order
      items.sort((a, b) => a.order - b.order);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items),
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
          body: JSON.stringify({ error: 'Item ID is required' }),
        };
      }

      // Read current items
      const itemsData = await store.get(`shopping/${slug}`, { type: 'json' });
      const items: ShoppingItem[] = (itemsData as ShoppingItem[]) || [];

      // Find the item
      const itemIndex = items.findIndex(i => i.id === id);
      if (itemIndex === -1) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Item not found' }),
        };
      }

      // Viewers can only update checked status
      if (!isAdmin) {
        if (checked !== undefined) {
          items[itemIndex].checked = checked;
        }
        await store.setJSON(`shopping/${slug}`, items);
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(items[itemIndex]),
        };
      }

      // Admin can update all fields
      const { name, description, link, price, linkPreview, category, order, links: linksBody } = body;

      if (name !== undefined) items[itemIndex].name = name.trim();
      if (description !== undefined) items[itemIndex].description = description?.trim() || undefined;
      if (link !== undefined) items[itemIndex].link = link?.trim() || undefined;
      if (price !== undefined) items[itemIndex].price = price?.trim() || undefined;
      if (linkPreview !== undefined) items[itemIndex].linkPreview = linkPreview || undefined;
      if (linksBody !== undefined && Array.isArray(linksBody)) {
        const linksArray: ShoppingItemLink[] = linksBody
          .filter((l: { url?: string }) => l && typeof l.url === 'string' && l.url.trim())
          .map((l: { url: string; description?: string; linkPreview?: LinkPreview }) => ({ url: l.url.trim(), description: l.description?.trim() || undefined, linkPreview: l.linkPreview }));
        items[itemIndex].links = linksArray.length > 0 ? linksArray : undefined;
        const first = linksArray[0];
        items[itemIndex].link = first?.url;
        items[itemIndex].linkPreview = first?.linkPreview;
      }
      if (category !== undefined) {
        const validCategories: ShoppingCategory[] = ['tops', 'bottoms', 'accessories', 'footwear', 'outerwear', 'uncategorized'];
        items[itemIndex].category = validCategories.includes(category) ? category : 'uncategorized';
      }
      if (checked !== undefined) items[itemIndex].checked = checked;
      if (order !== undefined && typeof order === 'number') items[itemIndex].order = order;

      await store.setJSON(`shopping/${slug}`, items);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items[itemIndex]),
      };
    }

    // All other operations require admin
    if (!isAdminValid(event)) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    // POST - Create new item
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { name, description, link, price, linkPreview, category, links: linksBody } = body;

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Item name is required' }),
        };
      }

      // Validate category
      const validCategories: ShoppingCategory[] = ['tops', 'bottoms', 'accessories', 'footwear', 'outerwear', 'uncategorized'];
      const itemCategory: ShoppingCategory = validCategories.includes(category) ? category : 'uncategorized';

      const linksArray: ShoppingItemLink[] = Array.isArray(linksBody) && linksBody.length > 0
        ? linksBody
            .filter((l: { url?: string }) => l && typeof l.url === 'string' && l.url.trim())
            .map((l: { url: string; description?: string; linkPreview?: LinkPreview }) => ({ url: l.url.trim(), description: l.description?.trim() || undefined, linkPreview: l.linkPreview }))
        : link && typeof link === 'string' && link.trim()
          ? [{ url: link.trim(), linkPreview: linkPreview || undefined }]
          : [];

      const firstLink = linksArray[0];

      // Read current items
      const itemsData = await store.get(`shopping/${slug}`, { type: 'json' });
      const items: ShoppingItem[] = (itemsData as ShoppingItem[]) || [];

      // Create new item
      const newItem: ShoppingItem = {
        id: generateId(),
        name: name.trim(),
        description: description?.trim() || undefined,
        link: firstLink?.url,
        price: price?.trim() || undefined,
        linkPreview: firstLink?.linkPreview,
        ...(linksArray.length > 0 && { links: linksArray }),
        category: itemCategory,
        checked: false,
        order: items.length,
        createdAt: new Date().toISOString(),
      };

      items.push(newItem);

      // Re-read before write to avoid losing items when multiple adds happen in quick succession
      const latestData = await store.get(`shopping/${slug}`, { type: 'json' });
      const latest: ShoppingItem[] = (latestData as ShoppingItem[]) || [];
      const merged = latest.some((i) => i.id === newItem.id) ? latest : [...latest, newItem];
      if (merged.length !== latest.length) {
        merged[merged.length - 1].order = merged.length - 1;
      }

      try {
        await store.setJSON(`shopping/${slug}`, merged);
      } catch (writeError) {
        console.error('cms-shopping: failed to save shopping list after add', writeError);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to save item. Please try again.' }),
        };
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      };
    }

    // DELETE - Delete item
    if (event.httpMethod === 'DELETE') {
      const id = event.queryStringParameters?.id;

      if (!id) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Item ID is required' }),
        };
      }

      // Read current items
      const itemsData = await store.get(`shopping/${slug}`, { type: 'json' });
      const items: ShoppingItem[] = (itemsData as ShoppingItem[]) || [];

      // Find the item
      const itemIndex = items.findIndex(i => i.id === id);
      if (itemIndex === -1) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Item not found' }),
        };
      }

      // Remove the item
      items.splice(itemIndex, 1);

      // Reorder remaining items
      items.forEach((item, i) => {
        item.order = i;
      });

      await store.setJSON(`shopping/${slug}`, items);

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
    console.error('Shopping list error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process request' }),
    };
  }
};

export { handler };
