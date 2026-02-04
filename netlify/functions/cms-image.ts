import type { Handler, HandlerEvent } from '@netlify/functions';
import { getStorage } from './lib/storage';

interface Lookbook {
  id: string;
  slug: string;
  clientName: string;
  passcode: string;
  createdAt: string;
}

/**
 * CMS Image - Serve an image blob
 * GET /api/cms-image?key=images/xxx&slug=yyy
 * Headers: X-Admin-Passcode or X-View-Passcode
 * 
 * Admin can access any image. View passcode is validated against the lookbook's passcode.
 */
const handler: Handler = async (event: HandlerEvent) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const key = event.queryStringParameters?.key;
    const slug = event.queryStringParameters?.slug;

    if (!key) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Image key is required' }),
      };
    }

    // Security: only allow images/ prefix and no path traversal
    if (!key.startsWith('images/') || key.includes('..')) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid image key' }),
      };
    }

    const store = getStorage('cms-editorial');

    // Check admin passcode first
    const adminPasscode = event.headers['x-admin-passcode'];
    const envAdminPasscode = process.env.ADMIN_PASSCODE;
    const isAdminValid = adminPasscode && envAdminPasscode && adminPasscode === envAdminPasscode;

    // If not admin, check view passcode for the specific lookbook
    if (!isAdminValid) {
      const viewPasscode = event.headers['x-view-passcode'];
      
      if (!viewPasscode || !slug) {
        return {
          statusCode: 401,
          body: JSON.stringify({ error: 'Unauthorized' }),
        };
      }

      // Get lookbook to verify passcode
      const lookbooksData = await store.get('lookbooks', { type: 'json' });
      const lookbooks: Lookbook[] = lookbooksData || [];
      const lookbook = lookbooks.find(l => l.slug === slug);

      if (!lookbook || viewPasscode !== lookbook.passcode) {
        return {
          statusCode: 401,
          body: JSON.stringify({ error: 'Unauthorized' }),
        };
      }
    }

    // Get image with metadata
    const result = await store.getWithMetadata(key, { type: 'arrayBuffer' });

    if (!result || !result.data) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Image not found' }),
      };
    }

    const contentType = (result.metadata as { contentType?: string })?.contentType || 'image/jpeg';
    
    // Convert ArrayBuffer to base64
    const buffer = Buffer.from(result.data as ArrayBuffer);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
      body: buffer.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error('Image fetch error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch image' }),
    };
  }
};

export { handler };
