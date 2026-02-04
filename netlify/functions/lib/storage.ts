import * as fs from 'fs';
import * as path from 'path';

// Local storage directory for development
const LOCAL_STORAGE_DIR = path.join(process.cwd(), '.netlify', 'blobs-data');

/**
 * Ensure the local storage directory exists
 */
function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Get the file path for a key in local storage
 */
function getFilePath(storeName: string, key: string): string {
  // Replace slashes in key with double underscores to flatten the path
  const safeKey = key.replace(/\//g, '__');
  return path.join(LOCAL_STORAGE_DIR, storeName, safeKey);
}

/**
 * Local file-based store implementation for development
 */
class LocalStore {
  private storeName: string;

  constructor(storeName: string) {
    this.storeName = storeName;
    ensureDir(path.join(LOCAL_STORAGE_DIR, storeName));
  }

  async get(key: string, options?: { type?: 'json' | 'text' | 'arrayBuffer' }): Promise<unknown> {
    const filePath = getFilePath(this.storeName, key);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const data = fs.readFileSync(filePath);
    if (options?.type === 'json') {
      return JSON.parse(data.toString('utf-8'));
    }
    if (options?.type === 'arrayBuffer') {
      return data.buffer;
    }
    return data.toString('utf-8');
  }

  async set(key: string, value: string | Buffer | ArrayBuffer): Promise<void> {
    const filePath = getFilePath(this.storeName, key);
    ensureDir(path.dirname(filePath));
    
    if (value instanceof ArrayBuffer) {
      fs.writeFileSync(filePath, Buffer.from(value));
    } else if (Buffer.isBuffer(value)) {
      fs.writeFileSync(filePath, value);
    } else {
      fs.writeFileSync(filePath, value, 'utf-8');
    }
  }

  async setJSON(key: string, value: unknown): Promise<void> {
    const filePath = getFilePath(this.storeName, key);
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf-8');
  }

  async delete(key: string): Promise<void> {
    const filePath = getFilePath(this.storeName, key);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  async getWithMetadata(key: string, options?: { type?: 'json' | 'text' | 'arrayBuffer' }): Promise<{ data: unknown; metadata: Record<string, string> } | null> {
    const filePath = getFilePath(this.storeName, key);
    const metaPath = filePath + '.meta';
    
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const rawData = fs.readFileSync(filePath);
    let metadata: Record<string, string> = {};
    
    if (fs.existsSync(metaPath)) {
      metadata = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    }

    let data: unknown;
    if (options?.type === 'json') {
      data = JSON.parse(rawData.toString('utf-8'));
    } else if (options?.type === 'arrayBuffer') {
      data = rawData.buffer;
    } else {
      data = rawData.toString('utf-8');
    }

    return { data, metadata };
  }

  async setWithMetadata(key: string, value: string | Buffer | ArrayBuffer, metadata: Record<string, string>): Promise<void> {
    const filePath = getFilePath(this.storeName, key);
    const metaPath = filePath + '.meta';
    ensureDir(path.dirname(filePath));
    
    // Write data
    if (value instanceof ArrayBuffer) {
      fs.writeFileSync(filePath, Buffer.from(value));
    } else if (Buffer.isBuffer(value)) {
      fs.writeFileSync(filePath, value);
    } else {
      fs.writeFileSync(filePath, value, 'utf-8');
    }
    
    // Write metadata
    fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2), 'utf-8');
  }
}

/**
 * Store interface that matches what we need from Netlify Blobs
 */
export interface Store {
  get(key: string, options?: { type?: 'json' | 'text' | 'arrayBuffer' }): Promise<unknown>;
  set(key: string, value: string | Buffer | ArrayBuffer): Promise<void>;
  setJSON(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
  getWithMetadata(key: string, options?: { type?: 'json' | 'text' | 'arrayBuffer' }): Promise<{ data: unknown; metadata: Record<string, string> } | null>;
  setWithMetadata(key: string, value: string | Buffer | ArrayBuffer, metadata: Record<string, string>): Promise<void>;
}

// Cache for store instances
const storeCache = new Map<string, Store>();

/**
 * Get a store that works in both local dev and production
 * Uses local file storage when Netlify Blobs is not configured
 */
export function getStorage(storeName: string): Store {
  // Return cached store if available
  if (storeCache.has(storeName)) {
    return storeCache.get(storeName)!;
  }

  // Check if we're in a Netlify environment (production, deploy preview, etc.)
  // NETLIFY is set in all Netlify environments, NETLIFY_DEV is set when running netlify dev locally
  const isNetlifyProduction = process.env.NETLIFY === 'true' && !process.env.NETLIFY_DEV;
  const hasNetlifyBlobsContext = !!process.env.NETLIFY_BLOBS_CONTEXT;
  
  if (isNetlifyProduction || hasNetlifyBlobsContext) {
    try {
      // Dynamic import to avoid issues when not in Netlify environment
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getStore } = require('@netlify/blobs');
      const netlifyStore = getStore(storeName);
      
      console.log(`[Storage] Using Netlify Blobs for "${storeName}"`);
      
      // Wrap Netlify Blobs store with our interface
      const store: Store = {
        get: (key, options) => netlifyStore.get(key, options),
        set: (key, value) => netlifyStore.set(key, value as string),
        setJSON: (key, value) => netlifyStore.setJSON(key, value),
        delete: (key) => netlifyStore.delete(key),
        getWithMetadata: (key, options) => netlifyStore.getWithMetadata(key, options),
        setWithMetadata: (key, value, metadata) => netlifyStore.set(key, value as string, { metadata }),
      };
      
      storeCache.set(storeName, store);
      return store;
    } catch (error) {
      console.error(`[Storage] Failed to initialize Netlify Blobs:`, error);
      throw error; // Don't fall back to local storage in production - it won't work
    }
  }

  // Use local file storage for development only
  console.log(`[Storage] Using local file storage for "${storeName}"`);
  const localStore = new LocalStore(storeName);
  storeCache.set(storeName, localStore);
  return localStore;
}
