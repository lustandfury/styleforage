import type { Handler, HandlerEvent } from '@netlify/functions';
import sharp from 'sharp';
import { getStorage } from './lib/storage';
import { normalizePastedText } from './lib/text';

/** Max length of the longest side after resize (keeps aspect ratio). */
const MAX_IMAGE_DIMENSION = 2400;
/** WebP quality (0–100). 85 is a good balance of size and quality. */
const WEBP_QUALITY = 85;

/**
 * Resize and compress image for web: max dimension 2400px, output WebP.
 * On failure (e.g. corrupt or unsupported), returns original buffer and contentType.
 */
async function optimizeImage(
  buffer: Buffer,
  contentType: string
): Promise<{ data: Buffer; contentType: string }> {
  try {
    const out = await sharp(buffer)
      .resize(MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
    return { data: out, contentType: 'image/webp' };
  } catch {
    return { data: buffer, contentType };
  }
}

type Season = 'spring' | 'summer' | 'fall' | 'winter';

interface EditorialEntry {
  id: string;
  imageKey: string;
  imageKeys?: string[];
  title?: string;
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
    const boundary = (boundaryMatch[1] || boundaryMatch[2] || '').trim();

    // Parse multipart form data
    const { fields, files } = parseMultipart(event.body || '', boundary);
    
    const imageFile = files.find(f => f.name === 'file');
    const title = (fields.title || '').trim();
    const caption = normalizePastedText(fields.caption || '');
    const slug = fields.slug;
    const entryId = fields.entryId; // Optional - for replacing or adding to entry
    const addPhoto = fields.addPhoto === 'true'; // If true with entryId, add photo to entry (don't replace)
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

    // Optimize for web: resize (max 2400px) and compress to WebP
    const { data: imageData, contentType: imageContentType } = await optimizeImage(
      imageFile.data,
      imageFile.contentType
    );

    // Get the editorial store
    const store = getStorage('cms-editorial', event);

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

    // Add photo to existing entry (append to imageKeys)
    if (entryId && addPhoto) {
      const entryIndex = entries.findIndex(e => e.id === entryId);
      if (entryIndex === -1) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Entry not found' }),
        };
      }

      const entry = entries[entryIndex];
      const newImageKey = `images/${entryId}-${Date.now()}`;

      await store.setWithMetadata(newImageKey, imageData, { contentType: imageContentType });

      const currentKeys = (entry.imageKeys && entry.imageKeys.length > 0) ? entry.imageKeys : [entry.imageKey];
      entry.imageKeys = [...currentKeys, newImageKey];
      // Keep imageKey as primary (first); no change when adding

      await store.setJSON(`entries/${slug}`, entries);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      };
    }

    // Replace existing entry's primary image (and remove other images for that entry)
    if (entryId) {
      const entryIndex = entries.findIndex(e => e.id === entryId);
      if (entryIndex === -1) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Entry not found' }),
        };
      }

      const existingEntry = entries[entryIndex];
      const keysToDelete = (existingEntry.imageKeys && existingEntry.imageKeys.length > 0)
        ? existingEntry.imageKeys
        : [existingEntry.imageKey];

      for (const key of keysToDelete) {
        try {
          await store.delete(key);
        } catch {
          // Ignore
        }
      }

      const newImageKey = `images/${entryId}-${Date.now()}`;
      await store.setWithMetadata(newImageKey, imageData, { contentType: imageContentType });

      entries[entryIndex].imageKey = newImageKey;
      entries[entryIndex].imageKeys = [newImageKey];

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

    // Save the optimized image blob with metadata
    await store.setWithMetadata(imageKey, imageData, { contentType: imageContentType });

    // Create new entry (always persist title so it saves to the database)
    const newEntry: EditorialEntry = {
      id,
      imageKey,
      imageKeys: [imageKey],
      title: title || '',
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
