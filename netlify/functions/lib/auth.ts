import type { HandlerEvent } from '@netlify/functions';
import { getStorage } from './storage';

/**
 * Generate a simple UUID v4
 */
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Validate admin passcode
 */
export function isAdminValid(event: HandlerEvent): boolean {
  const adminPasscode = event.headers['x-admin-passcode'];
  const envAdminPasscode = process.env.ADMIN_PASSCODE;
  return !!(adminPasscode && envAdminPasscode && adminPasscode === envAdminPasscode);
}

interface LookbookPasscode {
  slug: string;
  passcode: string;
}

/**
 * Validate view passcode for a specific lookbook
 */
export async function isViewValid(event: HandlerEvent, slug: string): Promise<boolean> {
  const viewPasscode = event.headers['x-view-passcode'];
  if (!viewPasscode) return false;

  const store = getStorage('cms-editorial', event);
  const data = await store.get('lookbooks', { type: 'json' });
  const lookbooks: LookbookPasscode[] = Array.isArray(data) ? data : [];
  const lookbook = lookbooks.find(l => l.slug === slug);

  return !!(lookbook && viewPasscode === lookbook.passcode);
}
