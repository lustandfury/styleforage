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

export interface LinkCard {
  id: string;
  title: string;
  description: string;
  links: { url: string; linkPreview?: LinkPreview }[];
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
 * CMS LinkCards - Manage link cards for a lookbook
 * GET /api/cms-linkcards?slug=xxx - List all link cards (admin or view passcode)
 * POST /api/cms-linkcards - Create new link card (admin only)
 * PATCH /api/cms-linkcards - Update link card (admin only)
 * DELETE /api/cms-linkcards - Delete link card (admin only)
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

    // GET - List link cards (admin or view access)
    if (event.httpMethod === 'GET') {
      const isAdmin = isAdminValid(event);
      const isViewer = await isViewValid(event, slug);

      if (!isAdmin && !isViewer) {
        return {
          statusCode: 401,
          body: JSON.stringify({ error: 'Unauthorized' }),
        };
      }

      const linkCardsData = await store.get(`linkcards/${slug}`, { type: 'json' });
      const linkCards: LinkCard[] = (linkCardsData as LinkCard[]) || [];

      // Sort by order
      linkCards.sort((a, b) => a.order - b.order);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(linkCards),
      };
    }

    // All operations require admin
    if (!isAdminValid(event)) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    // POST - Create new link card
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { title, description, links } = body;

      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Title is required' }),
        };
      }

      if (!description || typeof description !== 'string' || description.trim().length === 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Description is required' }),
        };
      }

      if (!links || !Array.isArray(links)) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Links array is required' }),
        };
      }

      // Validate links array
      const validLinks = links.filter(link => 
        link && 
        typeof link.url === 'string' && 
        link.url.trim().length > 0 &&
        link.url.startsWith('http')
      );

      // Read current link cards
      const linkCardsData = await store.get(`linkcards/${slug}`, { type: 'json' });
      const linkCards: LinkCard[] = (linkCardsData as LinkCard[]) || [];

      // Create new link card
      const newLinkCard: LinkCard = {
        id: generateId(),
        title: title.trim(),
        description: description.trim(),
        links: validLinks.map(link => ({
          url: link.url.trim(),
          linkPreview: link.linkPreview || undefined
        })),
        order: linkCards.length,
        createdAt: new Date().toISOString(),
      };

      linkCards.push(newLinkCard);
      await store.setJSON(`linkcards/${slug}`, linkCards);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLinkCard),
      };
    }

    // PATCH - Update link card
    if (event.httpMethod === 'PATCH') {
      const body = JSON.parse(event.body || '{}');
      const { id, title, description, links } = body;

      if (!id || typeof id !== 'string') {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Link card ID is required' }),
        };
      }

      // Read current link cards
      const linkCardsData = await store.get(`linkcards/${slug}`, { type: 'json' });
      const linkCards: LinkCard[] = (linkCardsData as LinkCard[]) || [];

      // Find the link card
      const linkCardIndex = linkCards.findIndex(lc => lc.id === id);
      if (linkCardIndex === -1) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Link card not found' }),
        };
      }

      // Update fields
      if (title !== undefined && typeof title === 'string' && title.trim().length > 0) {
        linkCards[linkCardIndex].title = title.trim();
      }
      if (description !== undefined && typeof description === 'string' && description.trim().length > 0) {
        linkCards[linkCardIndex].description = description.trim();
      }
      if (links !== undefined && Array.isArray(links)) {
        // Validate and update links
        const validLinks = links.filter(link => 
          link && 
          typeof link.url === 'string' && 
          link.url.trim().length > 0 &&
          link.url.startsWith('http')
        );
        linkCards[linkCardIndex].links = validLinks.map(link => ({
          url: link.url.trim(),
          linkPreview: link.linkPreview || undefined
        }));
      }

      await store.setJSON(`linkcards/${slug}`, linkCards);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(linkCards[linkCardIndex]),
      };
    }

    // DELETE - Delete link card
    if (event.httpMethod === 'DELETE') {
      const body = JSON.parse(event.body || '{}');
      const { id } = body;

      if (!id) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Link card ID is required' }),
        };
      }

      // Read current link cards
      const linkCardsData = await store.get(`linkcards/${slug}`, { type: 'json' });
      const linkCards: LinkCard[] = (linkCardsData as LinkCard[]) || [];

      // Find the link card
      const linkCardIndex = linkCards.findIndex(lc => lc.id === id);
      if (linkCardIndex === -1) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Link card not found' }),
        };
      }

      // Remove the link card
      linkCards.splice(linkCardIndex, 1);

      // Reorder remaining link cards
      linkCards.forEach((linkCard, i) => {
        linkCard.order = i;
      });

      await store.setJSON(`linkcards/${slug}`, linkCards);

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
    console.error('Link cards error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process request' }),
    };
  }
};

export { handler };
