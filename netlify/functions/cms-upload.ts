import type { Handler, HandlerEvent } from '@netlify/functions';
import { getStorage } from './lib/storage';

type Season = 'spring' | 'summer' | 'fall' | 'winter';

interface EditorialEntry {
  id: string;
  imageKey: string;
  caption: string;
  order: number;
  createdAt: string;
  season?: Season;
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
 * Parse multipart form data
 */
function parseMultipart(body: string, boundary: string): { fields: Record<string, string>; files: { name: string; filename: string; contentType: string; data: Buffer }[] } {
  const fields: Record<string, string> = {};
  const files: { name: string; filename: string; contentType: string; data: Buffer }[] = [];

  // Handle base64 encoded body
  const bodyBuffer = Buffer.from(body, 'base64');
  const bodyStr = bodyBuffer.toString('binary');
  
  const parts = bodyStr.split(`--${boundary}`);
  
  for (const part of parts) {
    if (part.trim() === '' || part.trim() === '--') continue;
    
    const headerEndIndex = part.indexOf('\r\n\r\n');
    if (headerEndIndex === -1) continue;
    
    const headerSection = part.substring(0, headerEndIndex);
    const content = part.substring(headerEndIndex + 4);
    
    // Remove trailing \r\n
    const cleanContent = content.replace(/\r\n$/, '');
    
    // Parse Content-Disposition header
    const dispositionMatch = headerSection.match(/Content-Disposition:\s*form-data;\s*name="([^"]+)"(?:;\s*filename="([^"]+)")?/i);
    if (!dispositionMatch) continue;
    
    const fieldName = dispositionMatch[1];
    const filename = dispositionMatch[2];
    
    if (filename) {
      // This is a file
      const contentTypeMatch = headerSection.match(/Content-Type:\s*([^\r\n]+)/i);
      const contentType = contentTypeMatch ? contentTypeMatch[1].trim() : 'application/octet-stream';
      
      files.push({
        name: fieldName,
        filename,
        contentType,
        data: Buffer.from(cleanContent, 'binary'),
      });
    } else {
      // This is a regular field
      fields[fieldName] = cleanContent;
    }
  }
  
  return { fields, files };
}

/**
 * CMS Upload - Upload a new outfit photo or replace an existing one
 * POST /api/cms-upload (multipart/form-data)
 * Headers: X-Admin-Passcode
 * Body: file (image), caption (text), slug (lookbook slug), entryId? (optional - if provided, replaces existing entry's image)
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
    // Validate admin passcode
    const adminPasscode = event.headers['x-admin-passcode'];
    const envAdminPasscode = process.env.ADMIN_PASSCODE;

    if (!adminPasscode || !envAdminPasscode || adminPasscode !== envAdminPasscode) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    // Parse content type to get boundary
    const contentType = event.headers['content-type'] || '';
    const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/);
    if (!boundaryMatch) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid content type - expected multipart/form-data' }),
      };
    }
    const boundary = boundaryMatch[1] || boundaryMatch[2];

    // Parse multipart form data
    const { fields, files } = parseMultipart(event.body || '', boundary);
    
    const imageFile = files.find(f => f.name === 'file');
    const caption = fields.caption || '';
    const slug = fields.slug;
    const entryId = fields.entryId; // Optional - for replacing existing entry's image
    const season = fields.season as Season | undefined;

    if (!slug) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Lookbook slug is required' }),
      };
    }

    if (!imageFile) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Image file is required' }),
      };
    }

    // Validate image type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
    if (!allowedTypes.includes(imageFile.contentType)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid image type. Allowed: JPEG, PNG, WebP, AVIF, GIF' }),
      };
    }

    // Get the editorial store
    const store = getStorage('cms-editorial');

    // Verify lookbook exists
    const lookbooksData = await store.get('lookbooks', { type: 'json' });
    const lookbooks: { slug: string }[] = lookbooksData || [];
    if (!lookbooks.some(l => l.slug === slug)) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Lookbook not found' }),
      };
    }

    // Read current entries for this lookbook
    const entriesData = await store.get(`entries/${slug}`, { type: 'json' });
    const entries: EditorialEntry[] = entriesData || [];

    // Check if this is a replacement or new upload
    if (entryId) {
      // Replacing existing entry's image
      const entryIndex = entries.findIndex(e => e.id === entryId);
      if (entryIndex === -1) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Entry not found' }),
        };
      }

      const existingEntry = entries[entryIndex];
      
      // Delete the old image
      try {
        await store.delete(existingEntry.imageKey);
      } catch {
        // Ignore errors deleting old image
      }

      // Generate new image key (keep same entry ID)
      const newImageKey = `images/${entryId}-${Date.now()}`;

      // Save the new image blob with metadata
      await store.setWithMetadata(newImageKey, imageFile.data, { contentType: imageFile.contentType });

      // Update the entry with new image key
      entries[entryIndex].imageKey = newImageKey;

      // Save updated entries
      await store.setJSON(`entries/${slug}`, entries);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entries[entryIndex]),
      };
    }
    
    // New upload - generate unique ID
    const id = generateId();
    const imageKey = `images/${id}`;

    // Save the image blob with metadata
    await store.setWithMetadata(imageKey, imageFile.data, { contentType: imageFile.contentType });

    // Create new entry
    const newEntry: EditorialEntry = {
      id,
      imageKey,
      caption,
      order: entries.length, // Append at end
      createdAt: new Date().toISOString(),
      ...(season && { season }),
    };

    // Add to entries and save
    entries.push(newEntry);
    await store.setJSON(`entries/${slug}`, entries);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEntry),
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to upload image' }),
    };
  }
};

export { handler };
