import type { Handler, HandlerEvent } from '@netlify/functions';
import { getStorage } from './lib/storage';

export interface Tip {
  id: string;
  text: string;
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

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function isAdminValid(event: HandlerEvent): boolean {
  const adminPasscode = event.headers['x-admin-passcode'];
  const envAdminPasscode = process.env.ADMIN_PASSCODE;
  return !!(adminPasscode && envAdminPasscode && adminPasscode === envAdminPasscode);
}

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
 * CMS Tips - Manage text tips for a lookbook
 * GET /api/cms-tips?slug=xxx - List all tips (admin or view passcode)
 * POST /api/cms-tips - Create new tip (admin only)
 * PATCH /api/cms-tips - Update tip (admin only)
 * DELETE /api/cms-tips?slug=xxx&id=yyy - Delete tip (admin only)
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

    if (event.httpMethod === 'GET') {
      const isAdmin = isAdminValid(event);
      const isViewer = await isViewValid(event, slug);

      if (!isAdmin && !isViewer) {
        return {
          statusCode: 401,
          body: JSON.stringify({ error: 'Unauthorized' }),
        };
      }

      const tipsData = await store.get(`tips/${slug}`, { type: 'json' });
      const tips: Tip[] = (tipsData as Tip[]) || [];
      tips.sort((a, b) => a.order - b.order);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tips),
      };
    }

    if (!isAdminValid(event)) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { text } = body;

      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Tip text is required' }),
        };
      }

      const tipsData = await store.get(`tips/${slug}`, { type: 'json' });
      const tips: Tip[] = (tipsData as Tip[]) || [];

      const newTip: Tip = {
        id: generateId(),
        text: normalizePastedText(text.trim()),
        order: tips.length,
        createdAt: new Date().toISOString(),
      };

      tips.push(newTip);
      await store.setJSON(`tips/${slug}`, tips);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTip),
      };
    }

    if (event.httpMethod === 'PATCH') {
      const body = JSON.parse(event.body || '{}');
      const { id, text, order } = body;

      if (!id || typeof id !== 'string') {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Tip ID is required' }),
        };
      }

      const tipsData = await store.get(`tips/${slug}`, { type: 'json' });
      const tips: Tip[] = (tipsData as Tip[]) || [];
      const tipIndex = tips.findIndex(t => t.id === id);

      if (tipIndex === -1) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Tip not found' }),
        };
      }

      if (text !== undefined) tips[tipIndex].text = normalizePastedText(String(text).trim());
      if (order !== undefined && typeof order === 'number') tips[tipIndex].order = order;

      await store.setJSON(`tips/${slug}`, tips);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tips[tipIndex]),
      };
    }

    if (event.httpMethod === 'DELETE') {
      const id = event.queryStringParameters?.id;

      if (!id) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Tip ID is required' }),
        };
      }

      const tipsData = await store.get(`tips/${slug}`, { type: 'json' });
      const tips: Tip[] = (tipsData as Tip[]) || [];
      const tipIndex = tips.findIndex(t => t.id === id);

      if (tipIndex === -1) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Tip not found' }),
        };
      }

      tips.splice(tipIndex, 1);
      tips.forEach((t, i) => { t.order = i; });
      await store.setJSON(`tips/${slug}`, tips);

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
    console.error('Tips error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process request' }),
    };
  }
};

export { handler };
