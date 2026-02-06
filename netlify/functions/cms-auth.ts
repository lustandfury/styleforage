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
 * CMS Auth - Validates admin or lookbook codes
 * POST /api/cms-auth
 * Body: { code?: string, passcode?: string, type?: 'admin' }
 * 
 * For admin auth: { passcode: string, type: 'admin' }
 * Returns: { success: true } or error
 * 
 * For lookbook login: { code: string }
 * Returns: { slug: string, clientName: string } or error
 */
const handler: Handler = async (event: HandlerEvent) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    
    // Handle admin authentication
    if (body.type === 'admin') {
      const passcode = body.passcode?.trim();
      const envAdminPasscode = process.env.ADMIN_PASSCODE;
      
      if (!passcode) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Passcode is required' }),
        };
      }
      
      if (!envAdminPasscode) {
        console.error('ADMIN_PASSCODE environment variable not set');
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Server configuration error' }),
        };
      }
      
      if (passcode === envAdminPasscode) {
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: true }),
        };
      } else {
        return {
          statusCode: 401,
          body: JSON.stringify({ error: 'Invalid code' }),
        };
      }
    }
    
    // Handle lookbook login (code or passcode field)
    const code = (body.code || body.passcode)?.trim();

    if (!code) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Code is required' }),
      };
    }

    const store = getStorage('cms-editorial', event);

    // Get all lookbooks
    const lookbooksData = await store.get('lookbooks', { type: 'json' });
    const lookbooks: Lookbook[] = lookbooksData || [];

    // Try to find a lookbook by passcode (case-insensitive)
    let lookbook = lookbooks.find(
      l => l.passcode.toLowerCase() === code.toLowerCase()
    );

    // If not found by passcode, try by slug (case-insensitive)
    if (!lookbook) {
      lookbook = lookbooks.find(
        l => l.slug.toLowerCase() === code.toLowerCase()
      );
    }

    if (!lookbook) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Invalid code. Please check and try again.' }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: lookbook.slug,
        clientName: lookbook.clientName,
      }),
    };
  } catch (error) {
    console.error('Auth error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Something went wrong. Please try again.' }),
    };
  }
};

export { handler };
