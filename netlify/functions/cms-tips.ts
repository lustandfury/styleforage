import type { Handler, HandlerEvent } from '@netlify/functions';
import { getStorage } from './lib/storage';
import { normalizePastedText } from './lib/text';
import { generateId, isAdminValid, isViewValid } from './lib/auth';

export interface Tip {
  id: string;
  text: string;
  order: number;
  createdAt: string;
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
      const tips: Tip[] = Array.isArray(tipsData) ? tipsData as Tip[] : [];
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
      const tips: Tip[] = Array.isArray(tipsData) ? tipsData as Tip[] : [];

      const newTip: Tip = {
        id: generateId(),
        text: normalizePastedText(text.trim()),
        order: tips.length,
        createdAt: new Date().toISOString(),
      };

      // Re-read before write to avoid losing concurrent adds
      const latestData = await store.get(`tips/${slug}`, { type: 'json' });
      const latest: Tip[] = Array.isArray(latestData) ? latestData as Tip[] : [];
      const merged = latest.some(t => t.id === newTip.id) ? latest : [...latest, newTip];
      if (merged.length !== latest.length) {
        merged[merged.length - 1].order = merged.length - 1;
      }
      try {
        await store.setJSON(`tips/${slug}`, merged);
      } catch (writeError) {
        console.error('cms-tips: failed to save tips after add', writeError);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to save tip. Please try again.' }),
        };
      }

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
      const tips: Tip[] = Array.isArray(tipsData) ? tipsData as Tip[] : [];
      const tipIndex = tips.findIndex(t => t.id === id);

      if (tipIndex === -1) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Tip not found' }),
        };
      }

      // Build desired state for this tip
      const updatedTip: Tip = { ...tips[tipIndex] };
      if (text !== undefined) updatedTip.text = normalizePastedText(String(text).trim());
      if (order !== undefined && typeof order === 'number') updatedTip.order = order;

      // Re-read latest before write to avoid overwriting concurrent changes
      const latestData = await store.get(`tips/${slug}`, { type: 'json' });
      const latest: Tip[] = Array.isArray(latestData) ? latestData as Tip[] : [];
      const latestIndex = latest.findIndex(t => t.id === id);
      if (latestIndex === -1) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Tip not found' }) };
      }
      latest[latestIndex] = updatedTip;

      try {
        await store.setJSON(`tips/${slug}`, latest);
      } catch (writeError) {
        console.error('cms-tips: failed to save tips after update', writeError);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to save tip. Please try again.' }),
        };
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTip),
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

      // Re-read latest data immediately before write to avoid overwriting concurrent changes
      const latestData = await store.get(`tips/${slug}`, { type: 'json' });
      const latest: Tip[] = Array.isArray(latestData) ? latestData as Tip[] : [];
      const filtered = latest.filter(t => t.id !== id);
      if (filtered.length === latest.length) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Tip not found' }),
        };
      }

      filtered.forEach((t, i) => { t.order = i; });
      try {
        await store.setJSON(`tips/${slug}`, filtered);
      } catch (writeError) {
        console.error('cms-tips: failed to save tips after delete', writeError);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to delete tip. Please try again.' }),
        };
      }

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
