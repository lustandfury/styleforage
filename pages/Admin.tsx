import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import heic2any from 'heic2any';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Lock, Upload, Trash2, Edit3, Save, X, LogOut, Image as ImageIcon, ArrowLeft, Plus, Users, Copy, Check, FolderOpen, Eye, Camera, ShoppingBag, DollarSign, Square, CheckSquare, Lightbulb, ChevronUp, ChevronDown, Share2, GripVertical } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { normalizePastedText } from '../utils/normalizeText';

type Season = 'spring' | 'summer' | 'fall' | 'winter';

const SEASON_LABELS: Record<Season, string> = {
  spring: 'Spring',
  summer: 'Summer',
  fall: 'Fall',
  winter: 'Winter',
};

const SEASON_ORDER: Season[] = ['spring', 'summer', 'fall', 'winter'];

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

/** Max dimension for client-side resize before upload (server also optimizes). */
const CLIENT_IMAGE_MAX_DIMENSION = 2400;
const CLIENT_IMAGE_QUALITY = 0.85;

function isHeicFile(file: File): boolean {
  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  return type === 'image/heic' || type === 'image/heif' || /\.(heic|heif)$/.test(name);
}

/**
 * Convert HEIC/HEIF file to JPEG in the browser. Returns original file if not HEIC or on error.
 */
async function convertHeicToJpeg(file: File, quality = 0.9): Promise<File> {
  if (!isHeicFile(file)) return file;
  try {
    const result = await heic2any({ blob: file, toType: 'image/jpeg', quality });
    const blob = Array.isArray(result) ? result[0] : result;
    if (!blob) return file;
    const name = file.name.replace(/\.[^.]+$/, '.jpg');
    return new File([blob], name, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

/**
 * Resize image file in the browser to reduce upload size. Keeps aspect ratio.
 * Returns original file if not an image or on error.
 */
function resizeImageFile(file: File, maxDimension: number, quality: number): Promise<File> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width <= maxDimension && height <= maxDimension) {
        resolve(file);
        return;
      }
      if (width > height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

function getCurrentSeason(): Season {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}

interface Lookbook {
  id: string;
  slug: string;
  clientName: string;
  title?: string;
  description?: string;
  passcode: string;
  season?: Season;
  createdAt: string;
}

interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  favicon?: string;
}

type ShoppingCategory = 'tops' | 'bottoms' | 'accessories' | 'footwear' | 'outerwear' | 'uncategorized';

const CATEGORY_LABELS: Record<ShoppingCategory, string> = {
  tops: 'Tops',
  bottoms: 'Bottoms',
  accessories: 'Accessories',
  footwear: 'Footwear',
  outerwear: 'Outerwear',
  uncategorized: 'Other',
};

const CATEGORY_ORDER: ShoppingCategory[] = ['tops', 'bottoms', 'accessories', 'footwear', 'outerwear', 'uncategorized'];

interface ShoppingItem {
  id: string;
  name: string;
  description?: string;
  link?: string;
  linkPreview?: LinkPreview;
  links?: { url: string; description?: string; linkPreview?: LinkPreview }[];
  category: ShoppingCategory;
  checked: boolean;
  order: number;
  createdAt: string;
}

interface ShoppingLink {
  id: string;
  url: string;
  title?: string;
  description?: string;
  linkPreview?: LinkPreview;
  checked: boolean;
  order: number;
  createdAt: string;
}

interface Tip {
  id: string;
  text: string;
  order: number;
  createdAt: string;
}

const PASSCODE_KEY = 'admin_passcode';

/** Message template for sharing lookbook with client (paste into email/text). */
function getShareMessage(clientName: string, url: string, code: string): string {
  return `Hi${clientName ? ` ${clientName}` : ''}! Here's your lookbook:\n\n${url}\n\nUse this code to view it: ${code}`;
}

interface ShareLookbookModalProps {
  clientName: string;
  passcode: string;
  slug: string;
  onClose: () => void;
}

function ShareLookbookModal({ clientName, passcode, slug, onClose }: ShareLookbookModalProps): React.ReactElement {
  const url = typeof window !== 'undefined' ? `${window.location.origin}/lookbook/${slug}` : '';
  const message = getShareMessage(clientName, url, passcode);
  const [copied, setCopied] = useState<'message' | 'url' | 'code' | null>(null);

  const copy = async (text: string, key: 'message' | 'url' | 'code') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      alert(text);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 border border-stone-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg text-stone-900">Share with your client</h3>
          <Button
            type="button"
            onClick={onClose}
            variant="ghost"
            size="icon"
            aria-label="Close"
          >
            <X size={20} />
          </Button>
        </div>
        <p className="text-sm text-stone-500 mb-4">
          Send your client the link and code below so they can view their lookbook.
        </p>
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Link</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={url}
                className="flex-1 px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 text-sm"
              />
              <Button
                type="button"
                onClick={() => copy(url, 'url')}
                variant="secondary"
                size="sm"
                className="flex-shrink-0 gap-1.5"
              >
                {copied === 'url' ? <Check size={16} /> : <Copy size={16} />}
                {copied === 'url' ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Password</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={passcode}
                className="flex-1 px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 text-sm font-mono"
              />
              <Button
                type="button"
                onClick={() => copy(passcode, 'code')}
                variant="secondary"
                size="sm"
                className="flex-shrink-0 gap-1.5"
              >
                {copied === 'code' ? <Check size={16} /> : <Copy size={16} />}
                {copied === 'code' ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            onClick={() => copy(message, 'message')}
            variant="primary"
            size="lg"
            fullWidth
            className="gap-2"
          >
            {copied === 'message' ? <Check size={18} /> : <Share2 size={18} />}
            {copied === 'message' ? 'Copied!' : 'Copy message (link + password)'}
          </Button>
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            size="md"
            fullWidth
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

export const Admin: React.FC = () => {
  const { slug, tab } = useParams<{ slug?: string; tab?: string }>();
  const navigate = useNavigate();
  
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Check for stored passcode on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(PASSCODE_KEY);
    if (stored) {
      verifyPasscode(stored, true);
    }
  }, []);

  const verifyPasscode = async (code: string, silent = false) => {
    if (!silent) {
      setIsAuthenticating(true);
      setAuthError('');
    }

    try {
      const res = await fetch('/.netlify/functions/cms-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: code, type: 'admin' }),
      });

      if (res.ok) {
        sessionStorage.setItem(PASSCODE_KEY, code);
        setPasscode(code);
        setIsAuthenticated(true);
      } else if (!silent) {
        setAuthError('Invalid code');
      }
    } catch {
      if (!silent) {
        setAuthError('Authentication failed. Please try again.');
      }
    } finally {
      if (!silent) {
        setIsAuthenticating(false);
      }
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyPasscode(passcode);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(PASSCODE_KEY);
    setIsAuthenticated(false);
    setPasscode('');
  };

  // Passcode screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-sage-100 text-sage-700 mb-4">
              <Lock size={32} />
            </div>
            <h1 className="font-serif text-2xl text-stone-900 mb-2">Admin Access</h1>
            <p className="text-stone-500 text-sm">Enter your 4-digit code to manage lookbooks</p>
          </div>

          <form onSubmit={handleAuthSubmit} className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
            <div className="mb-4">
              <label htmlFor="passcode" className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">
                4-digit code
              </label>
              <input
                id="passcode"
                type="password"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full h-11 px-4 rounded-lg border border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent text-center tracking-[0.4em] font-mono text-lg"
                placeholder="0000"
                maxLength={4}
                autoFocus
              />
            </div>

            {authError && (
              <p className="mb-4 text-sm text-red-600" role="alert">
                {authError}
              </p>
            )}

            <Button type="submit" variant="primary" size="lg" className="w-full rounded-full" disabled={isAuthenticating || !passcode}>
              {isAuthenticating ? 'Verifying…' : 'Unlock'}
            </Button>
          </form>

          <div className="text-center mt-6">
            <Link to="/" className="text-sm text-stone-500 hover:text-sage-600 transition-colors">
              ← Back to site
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show lookbook editor if slug is provided, otherwise show lookbook list
  if (slug) {
    return <LookbookEditor slug={slug} initialTab={tab} />;
  }

  return <LookbookList onLogout={handleLogout} />;
};

// Lookbook List Component
interface LookbookListProps {
  onLogout: () => void;
}

const LookbookList: React.FC<LookbookListProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const [lookbooks, setLookbooks] = useState<Lookbook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [shareLookbook, setShareLookbook] = useState<Lookbook | null>(null);
  const [copiedLookbookId, setCopiedLookbookId] = useState<string | null>(null);

  useEffect(() => {
    fetchLookbooks();
  }, []);

  const fetchLookbooks = async () => {
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/.netlify/functions/cms-lookbooks', {
        headers: { 'X-Admin-Passcode': sessionStorage.getItem(PASSCODE_KEY) || '' },
      });

      if (res.ok) {
        const data = await res.json();
        setLookbooks(data);
      } else {
        setError('Failed to load lookbooks');
      }
    } catch {
      setError('Failed to load lookbooks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    setIsCreating(true);
    setError('');

    try {
      const res = await fetch('/.netlify/functions/cms-lookbooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': sessionStorage.getItem(PASSCODE_KEY) || '',
        },
        body: JSON.stringify({ 
          clientName: newClientName.trim(), 
          title: newTitle.trim() || undefined,
          description: newDescription.trim() || undefined 
        }),
      });

      if (res.ok) {
        const newLookbook = await res.json();
        setLookbooks([newLookbook, ...lookbooks]);
        setNewTitle('');
        setNewDescription('');
        setNewClientName('');
        setShowCreateForm(false);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create lookbook');
      }
    } catch {
      setError('Failed to create lookbook');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (slug: string, clientName: string) => {
    if (!confirm(`Are you sure you want to delete "${clientName}"'s lookbook? This will delete all their photos.`)) return;

    try {
      const res = await fetch(`/.netlify/functions/cms-lookbooks?slug=${slug}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Passcode': sessionStorage.getItem(PASSCODE_KEY) || '' },
      });

      if (res.ok) {
        setLookbooks(lookbooks.filter((l) => l.slug !== slug));
      } else {
        setError('Failed to delete lookbook');
      }
    } catch {
      setError('Failed to delete lookbook');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-24 md:pb-8">
      {/* Header */}
      <header className="bg-white border-b border-stone-100 sticky top-0 z-10">
        <div className="px-4 py-3 md:py-4 flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3 md:gap-4">
            <Link to="/" className="text-stone-500 hover:text-sage-600 transition-colors p-1" aria-label="Back to site">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="font-serif text-lg md:text-xl text-stone-900">Lookbook Admin</h1>
          </div>
          <Button
            onClick={onLogout}
            variant="ghost"
            size="sm"
            className="gap-1.5 md:gap-2 text-stone-500 hover:text-red-600 hover:bg-red-50"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Log out</span>
          </Button>
        </div>
      </header>

      <main className="px-4 py-4 md:py-8 max-w-4xl mx-auto">
        {/* Create Button / Form */}
        {showCreateForm ? (
          <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm mb-6">
            <h2 className="font-serif text-lg text-stone-900 mb-4 flex items-center gap-2">
              <Users size={20} className="text-sage-600" />
              New Client Lookbook
            </h2>
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label htmlFor="client-name" className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">
                  Client Name
                </label>
                <input
                  id="client-name"
                  type="text"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent text-base"
                  placeholder="e.g., Sarah Jones"
                  autoFocus
                />
              </div>
              <div className="mb-4">
                <label htmlFor="lookbook-title" className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">
                  Title <span className="font-normal text-stone-400">(optional)</span>
                </label>
                <input
                  id="lookbook-title"
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent text-base"
                  placeholder="e.g., Spring Style Refresh"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="lookbook-description" className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">
                  Description <span className="font-normal text-stone-400">(optional)</span>
                </label>
                <textarea
                  id="lookbook-description"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent resize-none text-base"
                  placeholder="A curated collection of looks for the new season…"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="primary" size="md" className="rounded-full" disabled={!newClientName.trim() || isCreating}>
                  {isCreating ? 'Creating…' : 'Create Lookbook'}
                </Button>
                <Button
                  type="button"
                  onClick={() => { setShowCreateForm(false); setNewClientName(''); setNewTitle(''); setNewDescription(''); }}
                  variant="ghost"
                  size="md"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <Button
            onClick={() => setShowCreateForm(true)}
            variant="primary"
            size="lg"
            className="w-full md:w-auto gap-2 mb-6 shadow-sm"
          >
            <Plus size={20} />
            New Client Lookbook
          </Button>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm" role="alert">
            {error}
          </div>
        )}

        {/* Lookbooks List */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-base md:text-lg text-stone-900 flex items-center gap-2">
              <FolderOpen size={18} className="text-stone-400" />
              Client Lookbooks {lookbooks.length > 0 && <span className="text-stone-400">({lookbooks.length})</span>}
            </h2>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-stone-500">Loading…</div>
          ) : lookbooks.length === 0 ? (
            <div className="text-center py-12 text-stone-500 bg-white rounded-2xl border border-stone-100">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-sm md:text-base">No lookbooks yet. Create one for your first client.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lookbooks.map((lookbook) => (
                <div
                  key={lookbook.id}
                  className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm hover:border-sage-200 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => navigate(`/admin/${lookbook.slug}`)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-stone-900 text-base">{lookbook.clientName}</h3>
                        <div onClick={(e) => e.stopPropagation()}>
                          <Button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(lookbook.passcode);
                              setCopiedLookbookId(lookbook.slug);
                              setTimeout(() => setCopiedLookbookId(null), 2000);
                            }}
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-xs font-mono bg-stone-100 hover:bg-sage-100 text-stone-500 px-2.5 py-1"
                            title="Click to copy code"
                          >
                            {copiedLookbookId === lookbook.slug ? <Check size={12} className="text-sage-600" /> : <Copy size={12} className="text-stone-400" />}
                            {copiedLookbookId === lookbook.slug ? 'Copied!' : lookbook.passcode}
                          </Button>
                        </div>
                      </div>
                      <p className="text-stone-400 text-sm mt-0.5">
                        /lookbook/{lookbook.slug}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        onClick={() => setShareLookbook(lookbook)}
                        variant="secondary"
                        size="icon"
                        aria-label="Share with client"
                        title="Share with client"
                      >
                        <Share2 size={18} />
                      </Button>
                      <Button
                        onClick={() => window.open(`/lookbook/${lookbook.slug}`, '_blank')}
                        variant="icon"
                        size="icon"
                        aria-label="Preview lookbook"
                        title="Preview lookbook"
                      >
                        <Eye size={18} />
                      </Button>
                      <Button
                        onClick={() => handleDelete(lookbook.slug, lookbook.clientName)}
                        variant="icon-danger"
                        size="icon"
                        aria-label="Delete lookbook"
                        title="Delete lookbook"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

// Lookbook Editor Component
type TabId = 'looks' | 'shopping' | 'tips';

interface LookbookEditorProps {
  slug: string;
  initialTab?: string;
}

const LookbookEditor: React.FC<LookbookEditorProps> = ({ slug, initialTab }) => {
  const navigate = useNavigate();

  const VALID_TABS: TabId[] = ['looks', 'shopping', 'tips'];
  const activeTab: TabId = VALID_TABS.includes(initialTab as TabId) ? (initialTab as TabId) : 'looks';
  
  // CMS state
  const [entries, setEntries] = useState<EditorialEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [lookbookInfo, setLookbookInfo] = useState<{ clientName: string; passcode: string } | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isResettingPasscode, setIsResettingPasscode] = useState(false);
  const [copiedPasscode, setCopiedPasscode] = useState(false);

  // Upload state
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadSeason, setUploadSeason] = useState<Season | ''>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [editSeason, setEditSeason] = useState<Season | ''>('');
  
  // Entry filter state
  const [selectedEntrySeason, setSelectedEntrySeason] = useState<Season | 'all'>('all');

  // Shopping list state
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [isLoadingShopping, setIsLoadingShopping] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemLinks, setNewItemLinks] = useState<{ url: string; description: string; linkPreview: LinkPreview | null }[]>([{ url: '', description: '', linkPreview: null }]);
  const [newItemCategory, setNewItemCategory] = useState<ShoppingCategory>('uncategorized');
  const [isFetchingPreviewIndex, setIsFetchingPreviewIndex] = useState<number | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemDescription, setEditItemDescription] = useState('');
  const [editItemLinks, setEditItemLinks] = useState<{ url: string; description: string; linkPreview: LinkPreview | null }[]>([{ url: '', description: '', linkPreview: null }]);
  const [editItemCategory, setEditItemCategory] = useState<ShoppingCategory>('uncategorized');
  const [isFetchingEditPreview, setIsFetchingEditPreview] = useState(false);
  const [isFetchingEditPreviewIndex, setIsFetchingEditPreviewIndex] = useState<number | null>(null);

  // Shopping links state
  const [shoppingLinks, setShoppingLinks] = useState<ShoppingLink[]>([]);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkDescription, setNewLinkDescription] = useState('');
  const [newLinkPreview, setNewLinkPreview] = useState<LinkPreview | null>(null);
  const [isFetchingLinkPreview, setIsFetchingLinkPreview] = useState(false);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [editLinkUrl, setEditLinkUrl] = useState('');
  const [editLinkTitle, setEditLinkTitle] = useState('');
  const [editLinkDescription, setEditLinkDescription] = useState('');
  const [editLinkPreview, setEditLinkPreview] = useState<LinkPreview | null>(null);
  const [isFetchingEditLinkPreview, setIsFetchingEditLinkPreview] = useState(false);

  // Tips state
  const [tips, setTips] = useState<Tip[]>([]);
  const [isLoadingTips, setIsLoadingTips] = useState(false);
  const [showAddTip, setShowAddTip] = useState(false);
  const [newTipText, setNewTipText] = useState('');
  const [isAddingTip, setIsAddingTip] = useState(false);
  const [editingTipId, setEditingTipId] = useState<string | null>(null);
  const [editTipText, setEditTipText] = useState('');


  useEffect(() => {
    fetchLookbookInfo();
    fetchEntries();
    fetchShoppingItems();
    fetchShoppingLinks();
    fetchTips();
  }, [slug]);

  const fetchLookbookInfo = async () => {
    try {
      const res = await fetch('/.netlify/functions/cms-lookbooks', {
        headers: { 'X-Admin-Passcode': sessionStorage.getItem(PASSCODE_KEY) || '' },
      });
      if (res.ok) {
        const lookbooks: Lookbook[] = await res.json();
        const lookbook = lookbooks.find(l => l.slug === slug);
        if (lookbook) {
          setLookbookInfo({ clientName: lookbook.clientName, passcode: lookbook.passcode });
        }
      }
    } catch {
      // Ignore - not critical
    }
  };

  const handleResetPasscode = async () => {
    if (!slug || !lookbookInfo) return;
    const newCode = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    setIsResettingPasscode(true);
    setError('');
    try {
      const res = await fetch('/.netlify/functions/cms-lookbooks', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': sessionStorage.getItem(PASSCODE_KEY) || '',
        },
        body: JSON.stringify({ slug, passcode: newCode }),
      });
      if (res.ok) {
        setLookbookInfo((prev) => (prev ? { ...prev, passcode: newCode } : null));
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to reset passcode');
      }
    } catch {
      setError('Failed to reset passcode');
    } finally {
      setIsResettingPasscode(false);
    }
  };

  const fetchEntries = async () => {
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`/.netlify/functions/cms-list?slug=${slug}`, {
        headers: { 'X-Admin-Passcode': sessionStorage.getItem(PASSCODE_KEY) || '' },
      });

      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      } else if (res.status === 404) {
        navigate('/admin');
      } else {
        setError('Failed to load entries');
      }
    } catch {
      setError('Failed to load entries');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const list: File[] = Array.from(files);
    setUploadFiles(list);
    const first = list[0] as File;
    const toPreview: File = isHeicFile(first) ? await convertHeicToJpeg(first) : first;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(toPreview);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadFiles.length === 0) return;

    setIsUploading(true);
    setError('');

    try {
      const total = uploadFiles.length;
      let entryId: string | null = null;

      for (let i = 0; i < total; i++) {
        setUploadProgress(total > 1 ? `Uploading ${i + 1} of ${total}…` : null);
        const file = uploadFiles[i];
        const jpegFile = await convertHeicToJpeg(file);
        const fileToUpload = await resizeImageFile(
          jpegFile,
          CLIENT_IMAGE_MAX_DIMENSION,
          CLIENT_IMAGE_QUALITY
        );

        const formData = new FormData();
        formData.append('file', fileToUpload);
        formData.append('slug', slug);
        formData.append('title', uploadTitle);
        formData.append('caption', uploadCaption);
        if (uploadSeason) {
          formData.append('season', uploadSeason);
        }
        if (entryId) {
          formData.append('entryId', entryId);
          formData.append('addPhoto', 'true');
        }

        const res = await fetch('/.netlify/functions/cms-upload', {
          method: 'POST',
          headers: { 'X-Admin-Passcode': sessionStorage.getItem(PASSCODE_KEY) || '' },
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || `Upload failed (photo ${i + 1} of ${total})`);
          return;
        }

        const data = await res.json();
        if (!entryId) {
          entryId = data.id;
        }
      }

      await fetchEntries();
      resetUploadForm();
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploadProgress(null);
      setIsUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadFiles([]);
    setUploadProgress(null);
    setUploadTitle('');
    setUploadCaption('');
    setUploadSeason('');
    setUploadPreview(null);
    setShowUploadForm(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      const res = await fetch(`/.netlify/functions/cms-delete?slug=${slug}&id=${id}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Passcode': sessionStorage.getItem(PASSCODE_KEY) || '' },
      });

      if (res.ok) {
        setEntries(entries.filter((e) => e.id !== id));
      } else {
        setError('Failed to delete entry');
      }
    } catch {
      setError('Failed to delete entry');
    }
  };

  const startEdit = (entry: EditorialEntry) => {
    setEditingId(entry.id);
    setEditTitle(entry.title ?? '');
    setEditCaption(normalizePastedText(entry.caption));
    setEditSeason(entry.season || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditCaption('');
    setEditSeason('');
  };

  const sortedEntries = [...entries].sort((a, b) => a.order - b.order);
  const entrySensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const shoppingSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const moveEntryUp = async (entry: EditorialEntry) => {
    const idx = sortedEntries.findIndex((e) => e.id === entry.id);
    if (idx <= 0) return;
    const prev = sortedEntries[idx - 1];
    // Optimistic update
    setEntries((current) => current.map((e) => {
      if (e.id === entry.id) return { ...e, order: prev.order };
      if (e.id === prev.id) return { ...e, order: entry.order };
      return e;
    }));
    try {
      await Promise.all([
        fetch('/.netlify/functions/cms-update', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'X-Admin-Passcode': sessionStorage.getItem(PASSCODE_KEY) || '' },
          body: JSON.stringify({ slug, id: entry.id, order: prev.order }),
        }),
        fetch('/.netlify/functions/cms-update', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'X-Admin-Passcode': sessionStorage.getItem(PASSCODE_KEY) || '' },
          body: JSON.stringify({ slug, id: prev.id, order: entry.order }),
        }),
      ]);
    } catch {
      setError('Failed to reorder');
      await fetchEntries();
    }
  };
  const moveEntryDown = async (entry: EditorialEntry) => {
    const idx = sortedEntries.findIndex((e) => e.id === entry.id);
    if (idx < 0 || idx >= sortedEntries.length - 1) return;
    const next = sortedEntries[idx + 1];
    // Optimistic update
    setEntries((current) => current.map((e) => {
      if (e.id === entry.id) return { ...e, order: next.order };
      if (e.id === next.id) return { ...e, order: entry.order };
      return e;
    }));
    try {
      await Promise.all([
        fetch('/.netlify/functions/cms-update', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'X-Admin-Passcode': sessionStorage.getItem(PASSCODE_KEY) || '' },
          body: JSON.stringify({ slug, id: entry.id, order: next.order }),
        }),
        fetch('/.netlify/functions/cms-update', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'X-Admin-Passcode': sessionStorage.getItem(PASSCODE_KEY) || '' },
          body: JSON.stringify({ slug, id: next.id, order: entry.order }),
        }),
      ]);
    } catch {
      setError('Failed to reorder');
      await fetchEntries();
    }
  };

  const handleEntryReorder = async (orderedIds: string[]) => {
    try {
      await Promise.all(
        orderedIds.map((id, order) =>
          fetch('/.netlify/functions/cms-update', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'X-Admin-Passcode': sessionStorage.getItem(PASSCODE_KEY) || '' },
            body: JSON.stringify({ slug, id, order }),
          })
        )
      );
    } catch {
      setError('Failed to reorder');
      await fetchEntries();
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const res = await fetch('/.netlify/functions/cms-update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': sessionStorage.getItem(PASSCODE_KEY) || '',
        },
        body: JSON.stringify({ slug, id, title: editTitle || null, caption: editCaption, season: editSeason || null }),
      });

      if (res.ok) {
        const updated = await res.json();
        setEntries(entries.map((e) => (e.id === id ? updated : e)));
        cancelEdit();
      } else {
        setError('Failed to update entry');
      }
    } catch {
      setError('Failed to update entry');
    }
  };

  const handleReplacePhoto = async (entryId: string, file: File) => {
    setError('');

    try {
      const jpegFile = await convertHeicToJpeg(file);
      const fileToUpload = await resizeImageFile(
        jpegFile,
        CLIENT_IMAGE_MAX_DIMENSION,
        CLIENT_IMAGE_QUALITY
      );
      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('slug', slug);
      formData.append('entryId', entryId);

      const res = await fetch('/.netlify/functions/cms-upload', {
        method: 'POST',
        headers: { 'X-Admin-Passcode': sessionStorage.getItem(PASSCODE_KEY) || '' },
        body: formData,
      });

      if (res.ok) {
        const updated = await res.json();
        setEntries(entries.map((e) => (e.id === entryId ? updated : e)));
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to replace photo');
      }
    } catch {
      setError('Failed to replace photo. Please try again.');
    }
  };

  const handleAddPhoto = async (entryId: string, file: File) => {
    setError('');

    try {
      const jpegFile = await convertHeicToJpeg(file);
      const fileToUpload = await resizeImageFile(
        jpegFile,
        CLIENT_IMAGE_MAX_DIMENSION,
        CLIENT_IMAGE_QUALITY
      );
      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('slug', slug);
      formData.append('entryId', entryId);
      formData.append('addPhoto', 'true');

      const res = await fetch('/.netlify/functions/cms-upload', {
        method: 'POST',
        headers: { 'X-Admin-Passcode': sessionStorage.getItem(PASSCODE_KEY) || '' },
        body: formData,
      });

      if (res.ok) {
        const updated = await res.json();
        setEntries(entries.map((e) => (e.id === entryId ? updated : e)));
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to add photo');
      }
    } catch {
      setError('Failed to add photo. Please try again.');
    }
  };

  const handleDeleteImage = async (entryId: string, imageKey: string) => {
    if (!confirm('Remove this photo from the entry?')) return;
    setError('');

    try {
      const res = await fetch(
        `/.netlify/functions/cms-delete?slug=${slug}&id=${entryId}&key=${encodeURIComponent(imageKey)}`,
        { method: 'DELETE', headers: { 'X-Admin-Passcode': sessionStorage.getItem(PASSCODE_KEY) || '' } }
      );

      if (res.ok) {
        await fetchEntries();
      } else {
        setError('Failed to remove photo');
      }
    } catch {
      setError('Failed to remove photo');
    }
  };

  // Shopping list functions
  const fetchShoppingItems = async () => {
    setIsLoadingShopping(true);
    try {
      const res = await fetch(`/.netlify/functions/cms-shopping?slug=${slug}`, {
        headers: { 'X-Admin-Passcode': sessionStorage.getItem(PASSCODE_KEY) || '' },
      });
      if (res.ok) {
        const data = await res.json();
        setShoppingItems(data);
      }
    } catch {
      // Ignore - not critical
    } finally {
      setIsLoadingShopping(false);
    }
  };

  const handleAddShoppingItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    setIsAddingItem(true);
    setError('');

    try {
      const res = await fetch('/.netlify/functions/cms-shopping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': sessionStorage.getItem(PASSCODE_KEY) || '',
        },
        body: JSON.stringify({
          slug,
          name: newItemName,
          description: newItemDescription,
          links: newItemLinks.filter((l) => l.url.trim()).map((l) => ({ url: l.url.trim(), description: l.description.trim(), linkPreview: l.linkPreview || undefined })),
          category: newItemCategory,
        }),
      });

      if (res.ok) {
        const newItem = await res.json();
        setShoppingItems([...shoppingItems, newItem]);
        resetAddItemForm();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to add item');
      }
    } catch {
      setError('Failed to add item');
    } finally {
      setIsAddingItem(false);
    }
  };

  const resetAddItemForm = () => {
    setNewItemName('');
    setNewItemDescription('');
    setNewItemLinks([{ url: '', description: '', linkPreview: null }]);
    setNewItemCategory('uncategorized');
    setShowAddItem(false);
  };

  const fetchLinkPreview = async (url: string, isEdit = false, index = 0) => {
    if (!url || !url.startsWith('http')) return;

    if (isEdit) {
      setIsFetchingEditPreviewIndex(index);
    } else {
      setIsFetchingPreviewIndex(index);
    }

    try {
      const res = await fetch(`/.netlify/functions/fetch-link-preview?url=${encodeURIComponent(url)}`, {
        headers: { 'X-Admin-Passcode': sessionStorage.getItem(PASSCODE_KEY) || '' },
      });

      if (res.ok) {
        const preview = await res.json();
        if (!preview.error) {
          if (isEdit) {
            setEditItemLinks((prev) => prev.map((l, i) => (i === index ? { ...l, linkPreview: preview } : l)));
            if (!editItemName && preview.title) setEditItemName(preview.title);
          } else {
            setNewItemLinks((prev) => prev.map((l, i) => (i === index ? { ...l, linkPreview: preview } : l)));
            if (!newItemName && preview.title) setNewItemName(preview.title);
          }
        }
      }
    } catch {
      // Ignore
    } finally {
      if (isEdit) {
        setIsFetchingEditPreviewIndex(null);
      } else {
        setIsFetchingPreviewIndex(null);
      }
    }
  };

  const fetchLinkPreviewForIndex = async (index: number) => {
    const url = newItemLinks[index]?.url;
    if (!url || !url.startsWith('http')) return;
    setIsFetchingPreviewIndex(index);
    try {
      const res = await fetch(`/.netlify/functions/fetch-link-preview?url=${encodeURIComponent(url)}`, {
        headers: { 'X-Admin-Passcode': sessionStorage.getItem(PASSCODE_KEY) || '' },
      });
      if (res.ok) {
        const preview = await res.json();
        if (!preview.error) {
          setNewItemLinks((prev) => prev.map((l, i) => (i === index ? { ...l, linkPreview: preview } : l)));
          if (index === 0 && !newItemName && preview.title) setNewItemName(preview.title);
        }
      }
    } catch {
      // Ignore
    } finally {
      setIsFetchingPreviewIndex(null);
    }
  };


  const handleUpdateShoppingItem = async (id: string) => {
    setError('');

    try {
      const res = await fetch('/.netlify/functions/cms-shopping', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': sessionStorage.getItem(PASSCODE_KEY) || '',
        },
        body: JSON.stringify({
          slug,
          id,
          name: editItemName,
          description: editItemDescription,
          links: editItemLinks.filter((l) => l.url.trim()).map((l) => ({ url: l.url.trim(), description: l.description.trim(), linkPreview: l.linkPreview || undefined })),
          category: editItemCategory,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setShoppingItems(shoppingItems.map((i) => (i.id === id ? updated : i)));
        setEditingItemId(null);
        setEditItemCategory('uncategorized');
      } else {
        setError('Failed to update item');
      }
    } catch {
      setError('Failed to update item');
    }
  };

  const handleDeleteShoppingItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const res = await fetch(`/.netlify/functions/cms-shopping?slug=${slug}&id=${id}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Passcode': sessionStorage.getItem(PASSCODE_KEY) || '' },
      });

      if (res.ok) {
        setShoppingItems(shoppingItems.filter((i) => i.id !== id));
      } else {
        setError('Failed to delete item');
      }
    } catch {
      setError('Failed to delete item');
    }
  };

  const startEditItem = (item: ShoppingItem) => {
    setEditingItemId(item.id);
    setEditItemName(item.name);
    setEditItemDescription(item.description || '');
    setEditItemLinks(item.links && item.links.length > 0 
      ? item.links.map(l => ({ url: l.url, description: l.description || '', linkPreview: l.linkPreview || null }))
      : [{ url: item.link || '', description: '', linkPreview: item.linkPreview || null }]
    );
    setEditItemCategory(item.category || 'uncategorized');
  };

  const categoryOrderIndex = (c: ShoppingCategory) => {
    const i = CATEGORY_ORDER.indexOf(c || 'uncategorized');
    return i === -1 ? CATEGORY_ORDER.length : i;
  };
  const sortedShoppingItems = [...shoppingItems].sort((a, b) => {
    const byCat = categoryOrderIndex(a.category || 'uncategorized') - categoryOrderIndex(b.category || 'uncategorized');
    if (byCat !== 0) return byCat;
    return a.order - b.order;
  });
  const moveShoppingItemUp = async (item: ShoppingItem) => {
    const idx = sortedShoppingItems.findIndex((i) => i.id === item.id);
    if (idx <= 0) return;
    const prev = sortedShoppingItems[idx - 1];
    try {
      await Promise.all([
        fetch('/.netlify/functions/cms-shopping', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'X-Admin-Passcode': sessionStorage.getItem(PASSCODE_KEY) || '' },
          body: JSON.stringify({ slug, id: item.id, order: prev.order }),
        }),
        fetch('/.netlify/functions/cms-shopping', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'X-Admin-Passcode': sessionStorage.getItem(PASSCODE_KEY) || '' },
          body: JSON.stringify({ slug, id: prev.id, order: item.order }),
        }),
      ]);
      await fetchShoppingItems();
    } catch {
      setError('Failed to reorder');
    }
  };
  const moveShoppingItemDown = async (item: ShoppingItem) => {
    const idx = sortedShoppingItems.findIndex((i) => i.id === item.id);
    if (idx < 0 || idx >= sortedShoppingItems.length - 1) return;
    const next = sortedShoppingItems[idx + 1];
    try {
      await Promise.all([
        fetch('/.netlify/functions/cms-shopping', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'X-Admin-Passcode': sessionStorage.getItem(PASSCODE_KEY) || '' },
          body: JSON.stringify({ slug, id: item.id, order: next.order }),
        }),
        fetch('/.netlify/functions/cms-shopping', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'X-Admin-Passcode': sessionStorage.getItem(PASSCODE_KEY) || '' },
          body: JSON.stringify({ slug, id: next.id, order: item.order }),
        }),
      ]);
      await fetchShoppingItems();
    } catch {
      setError('Failed to reorder');
    }
  };

  const handleShoppingReorder = async (orderedIds: string[]) => {
    try {
      await Promise.all(
        orderedIds.map((id, order) =>
          fetch('/.netlify/functions/cms-shopping', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'X-Admin-Passcode': sessionStorage.getItem(PASSCODE_KEY) || '' },
            body: JSON.stringify({ slug, id, order }),
          })
        )
      );
    } catch {
      setError('Failed to reorder');
      await fetchShoppingItems();
    }
  };

  // Shopping links functions
  const fetchShoppingLinks = async () => {
    setIsLoadingLinks(true);
    try {
      const res = await fetch(`/.netlify/functions/cms-links?slug=${slug}`, {
        headers: { 'X-Admin-Passcode': sessionStorage.getItem(PASSCODE_KEY) || '' },
      });
      if (res.ok) {
        const data = await res.json();
        setShoppingLinks(data);
      }
    } catch {
      // Ignore - not critical
    } finally {
      setIsLoadingLinks(false);
    }
  };

  const fetchTips = async () => {
    if (!slug) return;
    setIsLoadingTips(true);
    try {
      const res = await fetch(`/.netlify/functions/cms-tips?slug=${slug}`, {
        headers: { 'X-Admin-Passcode': sessionStorage.getItem(PASSCODE_KEY) || '' },
      });
      if (res.ok) {
        const data = await res.json();
        setTips(data);
      }
    } catch {
      // Ignore - not critical
    } finally {
      setIsLoadingTips(false);
    }
  };


  const handleAddTip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTipText.trim()) return;

    setIsAddingTip(true);
    setError('');

    try {
      const res = await fetch('/.netlify/functions/cms-tips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': sessionStorage.getItem(PASSCODE_KEY) || '',
        },
        body: JSON.stringify({ slug, text: newTipText }),
      });

      if (res.ok) {
        const newTip = await res.json();
        setTips([...tips, newTip]);
        setNewTipText('');
        setShowAddTip(false);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to add tip');
      }
    } catch {
      setError('Failed to add tip');
    } finally {
      setIsAddingTip(false);
    }
  };

  const handleUpdateTip = async (id: string) => {
    try {
      const res = await fetch('/.netlify/functions/cms-tips', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': sessionStorage.getItem(PASSCODE_KEY) || '',
        },
        body: JSON.stringify({ slug, id, text: editTipText }),
      });

      if (res.ok) {
        const updated = await res.json();
        setTips(tips.map((t) => (t.id === id ? updated : t)));
        setEditingTipId(null);
      } else {
        setError('Failed to update tip');
      }
    } catch {
      setError('Failed to update tip');
    }
  };

  const handleDeleteTip = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tip?')) return;

    try {
      const res = await fetch(`/.netlify/functions/cms-tips?slug=${slug}&id=${id}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Passcode': sessionStorage.getItem(PASSCODE_KEY) || '' },
      });

      if (res.ok) {
        setTips(tips.filter((t) => t.id !== id));
      } else {
        setError('Failed to delete tip');
      }
    } catch {
      setError('Failed to delete tip');
    }
  };

  const startEditTip = (tip: Tip) => {
    setEditingTipId(tip.id);
    setEditTipText(normalizePastedText(tip.text));
  };

  const handleAddShoppingLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkUrl.trim()) return;

    setIsAddingLink(true);
    try {
      const res = await fetch('/.netlify/functions/cms-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': sessionStorage.getItem(PASSCODE_KEY) || '',
        },
        body: JSON.stringify({
          slug,
          url: newLinkUrl,
          title: newLinkTitle,
          description: newLinkDescription,
          linkPreview: newLinkPreview,
        }),
      });

      if (res.ok) {
        const newLink = await res.json();
        setShoppingLinks([...shoppingLinks, newLink]);
        resetAddLinkForm();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to add link');
      }
    } catch {
      setError('Failed to add link');
    } finally {
      setIsAddingLink(false);
    }
  };

  const resetAddLinkForm = () => {
    setNewLinkUrl('');
    setNewLinkTitle('');
    setNewLinkDescription('');
    setNewLinkPreview(null);
    setShowAddLink(false);
  };

  const handleUpdateShoppingLink = async (id: string) => {
    try {
      const res = await fetch('/.netlify/functions/cms-links', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': sessionStorage.getItem(PASSCODE_KEY) || '',
        },
        body: JSON.stringify({
          slug,
          id,
          url: editLinkUrl,
          title: editLinkTitle,
          description: editLinkDescription,
          linkPreview: editLinkPreview,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setShoppingLinks(shoppingLinks.map((l) => (l.id === id ? updated : l)));
        setEditingLinkId(null);
        setEditLinkPreview(null);
      } else {
        setError('Failed to update link');
      }
    } catch {
      setError('Failed to update link');
    }
  };

  const handleDeleteShoppingLink = async (id: string) => {
    if (!confirm('Are you sure you want to delete this link?')) return;

    try {
      const res = await fetch(`/.netlify/functions/cms-links?slug=${slug}&id=${id}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Passcode': sessionStorage.getItem(PASSCODE_KEY) || '' },
      });

      if (res.ok) {
        setShoppingLinks(shoppingLinks.filter((l) => l.id !== id));
      } else {
        setError('Failed to delete link');
      }
    } catch {
      setError('Failed to delete link');
    }
  };

  const handleToggleLinkChecked = async (id: string, checked: boolean) => {
    // Optimistic update
    setShoppingLinks(shoppingLinks.map((l) => (l.id === id ? { ...l, checked } : l)));

    try {
      const res = await fetch('/.netlify/functions/cms-links', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': sessionStorage.getItem(PASSCODE_KEY) || '',
        },
        body: JSON.stringify({ slug, id, checked }),
      });

      if (!res.ok) {
        // Revert on error
        setShoppingLinks(shoppingLinks.map((l) => (l.id === id ? { ...l, checked: !checked } : l)));
      }
    } catch {
      // Revert on error
      setShoppingLinks(shoppingLinks.map((l) => (l.id === id ? { ...l, checked: !checked } : l)));
    }
  };

  const startEditLink = (link: ShoppingLink) => {
    setEditingLinkId(link.id);
    setEditLinkUrl(link.url);
    setEditLinkTitle(link.title || '');
    setEditLinkDescription(link.description || '');
    setEditLinkPreview(link.linkPreview || null);
  };

  const fetchNewLinkPreview = async (url: string) => {
    if (!url.trim()) return;
    setIsFetchingLinkPreview(true);
    try {
      const res = await fetch(`/.netlify/functions/fetch-link-preview?url=${encodeURIComponent(url)}`, {
        headers: { 'X-Admin-Passcode': sessionStorage.getItem(PASSCODE_KEY) || '' },
      });
      if (res.ok) {
        const data = await res.json();
        setNewLinkPreview(data);
        if (data.title && !newLinkTitle) setNewLinkTitle(data.title);
        if (data.description && !newLinkDescription) setNewLinkDescription(data.description);
      }
    } catch {
      // Ignore - preview is optional
    } finally {
      setIsFetchingLinkPreview(false);
    }
  };

  const fetchEditLinkPreview = async (url: string) => {
    if (!url.trim()) return;
    setIsFetchingEditLinkPreview(true);
    try {
      const res = await fetch(`/.netlify/functions/fetch-link-preview?url=${encodeURIComponent(url)}`, {
        headers: { 'X-Admin-Passcode': sessionStorage.getItem(PASSCODE_KEY) || '' },
      });
      if (res.ok) {
        const data = await res.json();
        setEditLinkPreview(data);
      }
    } catch {
      // Ignore - preview is optional
    } finally {
      setIsFetchingEditLinkPreview(false);
    }
  };

  // Auto-fetch link preview when URL changes (debounced)
  useEffect(() => {
    if (!newLinkUrl.trim()) {
      setNewLinkPreview(null);
      return;
    }

    // Check if it's a valid URL
    try {
      new URL(newLinkUrl);
    } catch {
      return; // Not a valid URL yet
    }

    const timeoutId = setTimeout(() => {
      fetchNewLinkPreview(newLinkUrl);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [newLinkUrl]);

  // Auto-fetch edit link preview when URL changes (debounced)
  useEffect(() => {
    if (!editLinkUrl.trim() || !editingLinkId) {
      return;
    }

    // Check if it's a valid URL
    try {
      new URL(editLinkUrl);
    } catch {
      return; // Not a valid URL yet
    }

    const timeoutId = setTimeout(() => {
      fetchEditLinkPreview(editLinkUrl);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [editLinkUrl, editingLinkId]);

  return (
    <div className="min-h-screen bg-stone-50 pb-24 md:pb-8">
      {/* Header */}
      <header className="bg-white border-b border-stone-100 sticky top-0 z-10">
        <div className="px-4 py-3 md:py-4 flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3 md:gap-4">
            <Button
              onClick={() => navigate('/admin')}
              variant="ghost"
              size="icon"
              aria-label="Back to lookbooks"
            >
              <ArrowLeft size={20} />
            </Button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-serif text-lg md:text-xl text-stone-900">
                  {lookbookInfo?.clientName || 'Lookbook'}
                </h1>
                {lookbookInfo && (
                  <Button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(lookbookInfo.passcode);
                      setCopiedPasscode(true);
                      setTimeout(() => setCopiedPasscode(false), 2000);
                    }}
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs font-mono bg-stone-100 hover:bg-sage-100 text-stone-500 px-2.5 py-1"
                    title="Click to copy"
                  >
                    {copiedPasscode ? <Check size={12} className="text-sage-600" /> : <Copy size={12} className="text-stone-400" />}
                    {copiedPasscode ? 'Copied!' : lookbookInfo.passcode}
                  </Button>
                )}
              </div>
              {lookbookInfo && !/^\d{4}$/.test(lookbookInfo.passcode) && (
                <Button
                  type="button"
                  onClick={handleResetPasscode}
                  disabled={isResettingPasscode}
                  variant="ghost"
                  size="sm"
                  className="text-sage-600 hover:text-sage-700 text-xs font-medium mt-0.5"
                >
                  {isResettingPasscode ? 'Resetting…' : 'Reset to 4-digit code'}
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowShareModal(true)}
              variant="outline"
              size="sm"
              className="gap-1.5"
              title="Share with client"
              aria-label="Share with client"
            >
              <Share2 size={16} />
              <span className="hidden sm:inline">Share</span>
            </Button>
            <Button
              onClick={() => window.open(`/lookbook/${slug}`, '_blank')}
              variant="outline"
              size="sm"
              className="gap-1.5"
              title="Preview lookbook"
            >
              <Eye size={16} />
              <span className="hidden sm:inline">Preview</span>
            </Button>
          </div>
        </div>
      </header>

      {showShareModal && lookbookInfo && (
        <ShareLookbookModal
          clientName={lookbookInfo.clientName}
          passcode={lookbookInfo.passcode}
          slug={slug}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Tabs */}
      <div className="bg-white border-b border-stone-100">
        <div className="px-4 max-w-4xl mx-auto flex gap-1">
          <Link
            to={`/admin/${slug}/looks`}
            replace
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'looks'
                ? 'border-sage-500 text-sage-600'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <ImageIcon size={16} />
              Looks
              {entries.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-md text-xs font-medium bg-stone-100 text-stone-400">{entries.length}</span>
              )}
            </span>
          </Link>
          <Link
            to={`/admin/${slug}/shopping`}
            replace
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'shopping'
                ? 'border-sage-500 text-sage-600'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <ShoppingBag size={16} />
              Shopping List
              {shoppingItems.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-md text-xs font-medium bg-stone-100 text-stone-400">{shoppingItems.length}</span>
              )}
            </span>
          </Link>
          <Link
            to={`/admin/${slug}/tips`}
            replace
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'tips'
                ? 'border-sage-500 text-sage-600'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <Lightbulb size={16} />
              Tips
              {tips.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-md text-xs font-medium bg-stone-100 text-stone-400">{tips.length}</span>
              )}
            </span>
          </Link>
        </div>
      </div>

      <main className="px-4 py-4 md:py-8 max-w-4xl mx-auto">
        {/* Error */}
        {error && (
          <div className="mb-4 md:mb-6 p-3 md:p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm" role="alert">
            {error}
          </div>
        )}

        {/* LOOKS TAB */}
        {activeTab === 'looks' && (
          <>
            {/* Entries List */}
            <section>
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h2 className="font-serif text-base md:text-lg text-stone-900">
                  Lookbook Entries {entries.length > 0 && <span className="text-stone-400">({entries.length})</span>}
                </h2>
                {!showUploadForm && (
                  <Button
                    onClick={() => setShowUploadForm(true)}
                    variant="primary"
                    size="md"
                    className="gap-1.5"
                  >
                    <Plus size={16} />
                    Add Outfit
                  </Button>
                )}
              </div>
              {/* Season Filter for entries */}
              {entries.some(e => e.season) && (
                <div className="flex flex-wrap gap-1.5 mb-3 md:mb-4">
                  <Button
                    onClick={() => setSelectedEntrySeason('all')}
                    variant={selectedEntrySeason === 'all' ? 'chip-selected' : 'chip'}
                    size="sm"
                    className="text-xs"
                  >
                    All
                  </Button>
                  {SEASON_ORDER.map((season) => (
                    <Button
                      key={season}
                      onClick={() => setSelectedEntrySeason(season)}
                      variant={selectedEntrySeason === season ? 'chip-selected' : 'chip'}
                      size="sm"
                      className="text-xs"
                    >
                      {SEASON_LABELS[season]}
                    </Button>
                  ))}
                </div>
              )}

              <div className="space-y-3 md:space-y-4">
                {showUploadForm && (
                  <div className="bg-white p-3 md:p-4 rounded-2xl border border-sage-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-serif text-base text-stone-900">New Outfit</h3>
                      <Button
                        onClick={resetUploadForm}
                        variant="ghost"
                        size="icon"
                        aria-label="Cancel"
                      >
                        <X size={18} />
                      </Button>
                    </div>
                    <UploadForm
                      fileInputRef={fileInputRef}
                      uploadFiles={uploadFiles}
                      uploadPreview={uploadPreview}
                      uploadProgress={uploadProgress}
                      uploadTitle={uploadTitle}
                      uploadCaption={uploadCaption}
                      uploadSeason={uploadSeason}
                      isUploading={isUploading}
                      onFileChange={handleFileChange}
                      onTitleChange={setUploadTitle}
                      onCaptionChange={setUploadCaption}
                      onSeasonChange={setUploadSeason}
                      onSubmit={handleUpload}
                      onClearFile={() => {
                        setUploadFiles([]);
                        setUploadPreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    />
                  </div>
                )}
              </div>
              {isLoading ? (
                <div className="text-center py-12 text-stone-500">Loading…</div>
              ) : entries.length === 0 && !showUploadForm ? (
                <div className="text-center py-12 text-stone-500 bg-white rounded-2xl border border-stone-100">
                  <ImageIcon size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-sm md:text-base">No entries yet. Upload the first outfit.</p>
                </div>
              ) : selectedEntrySeason === 'all' ? (
                <DndContext
                  sensors={entrySensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event: DragEndEvent) => {
                    const { active, over } = event;
                    if (!over || active.id === over.id) return;
                    const oldIndex = sortedEntries.findIndex((e) => e.id === active.id);
                    const newIndex = sortedEntries.findIndex((e) => e.id === over.id);
                    if (oldIndex === -1 || newIndex === -1) return;
                    const reordered = [...sortedEntries];
                    const [removed] = reordered.splice(oldIndex, 1);
                    reordered.splice(newIndex, 0, removed);
                    setEntries(reordered.map((e, i) => ({ ...e, order: i })));
                    handleEntryReorder(reordered.map((e) => e.id));
                  }}
                >
                  <SortableContext items={sortedEntries.map((e) => e.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3 md:space-y-4">
                      {sortedEntries.map((entry) => {
                        const entryIndex = sortedEntries.findIndex((e) => e.id === entry.id);
                        return (
                          <SortableEntryCard
                            key={entry.id}
                            entry={entry}
                            slug={slug}
                            passcode={sessionStorage.getItem(PASSCODE_KEY) || ''}
                            isEditing={editingId === entry.id}
                            editTitle={editTitle}
                            editCaption={editCaption}
                            editSeason={editSeason}
                            onEditTitleChange={setEditTitle}
                            onEditCaptionChange={setEditCaption}
                            onEditSeasonChange={setEditSeason}
                            onStartEdit={() => startEdit(entry)}
                            onCancelEdit={cancelEdit}
                            onSave={() => handleUpdate(entry.id)}
                            onDelete={() => handleDelete(entry.id)}
                            onReplacePhoto={handleReplacePhoto}
                            onAddPhoto={handleAddPhoto}
                            onDeleteImage={handleDeleteImage}
                            canMoveUp={entryIndex > 0}
                            canMoveDown={entryIndex >= 0 && entryIndex < sortedEntries.length - 1}
                          />
                        );
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="space-y-3 md:space-y-4">
                  {entries
                    .filter((entry) => entry.season === selectedEntrySeason)
                    .map((entry) => {
                    const entryIndex = sortedEntries.findIndex((e) => e.id === entry.id);
                    return (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      slug={slug}
                      passcode={sessionStorage.getItem(PASSCODE_KEY) || ''}
                      isEditing={editingId === entry.id}
                      editTitle={editTitle}
                      editCaption={editCaption}
                      editSeason={editSeason}
                      onEditTitleChange={setEditTitle}
                      onEditCaptionChange={setEditCaption}
                      onEditSeasonChange={setEditSeason}
                      onStartEdit={() => startEdit(entry)}
                      onCancelEdit={cancelEdit}
                      onSave={() => handleUpdate(entry.id)}
                      onDelete={() => handleDelete(entry.id)}
                      onReplacePhoto={handleReplacePhoto}
                      onAddPhoto={handleAddPhoto}
                      onDeleteImage={handleDeleteImage}
                      onMoveUp={() => moveEntryUp(entry)}
                      onMoveDown={() => moveEntryDown(entry)}
                      canMoveUp={entryIndex > 0}
                      canMoveDown={entryIndex >= 0 && entryIndex < sortedEntries.length - 1}
                    />
                  ); })}
                </div>
              )}
            </section>
          </>
        )}

        {/* SHOPPING TAB */}
        {activeTab === 'shopping' && (
          <>
            {/* Shopping Items List - Drag to reorder */}
            <section>
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h2 className="font-serif text-base md:text-lg text-stone-900">
                  Shopping Items {shoppingItems.length > 0 && <span className="text-stone-400">({shoppingItems.length})</span>}
                </h2>
                {!showAddItem && (
                  <Button
                    onClick={() => setShowAddItem(true)}
                    variant="primary"
                    size="md"
                    className="gap-1.5"
                  >
                    <Plus size={16} />
                    Add Item
                  </Button>
                )}
              </div>

              <div className="pr-1 space-y-3">
                {showAddItem && (
                  <div className="bg-white p-3 md:p-4 rounded-2xl border border-sage-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-serif text-base text-stone-900">New Item</h3>
                      <Button
                        onClick={resetAddItemForm}
                        variant="ghost"
                        size="icon"
                        aria-label="Cancel"
                      >
                        <X size={18} />
                      </Button>
                    </div>
                    <ShoppingItemForm
                      name={newItemName}
                      description={newItemDescription}
                      links={newItemLinks}
                      category={newItemCategory}
                      isFetchingPreviewIndex={isFetchingPreviewIndex}
                      onNameChange={setNewItemName}
                      onDescriptionChange={setNewItemDescription}
                      onLinkChange={(i, url) => setNewItemLinks((prev) => prev.map((l, j) => (j === i ? { ...l, url } : l)))}
                      onLinkDescriptionChange={(i, description) => setNewItemLinks((prev) => prev.map((l, j) => (j === i ? { ...l, description } : l)))}
                      onCategoryChange={setNewItemCategory}
                      onFetchPreview={fetchLinkPreviewForIndex}
                      onAddLink={() => setNewItemLinks((prev) => [...prev, { url: '', description: '', linkPreview: null }])}
                      onRemoveLink={(i) => setNewItemLinks((prev) => prev.filter((_, j) => j !== i))}
                      onSubmit={handleAddShoppingItem}
                      isSubmitting={isAddingItem}
                      submitLabel="Add Item"
                    />
                  </div>
                )}
                {isLoadingShopping ? (
                  <div className="text-center py-12 text-stone-500">Loading…</div>
                ) : shoppingItems.length === 0 && !showAddItem ? (
                  <div className="text-center py-12 text-stone-500 bg-white rounded-2xl border border-stone-100">
                    <ShoppingBag size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-sm md:text-base">No items yet. Add the first shopping item.</p>
                  </div>
                ) : shoppingItems.length > 0 ? (
                  <DndContext
                    sensors={shoppingSensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event: DragEndEvent) => {
                      const { active, over } = event;
                      if (!over || active.id === over.id) return;
                      const oldIndex = sortedShoppingItems.findIndex((i) => i.id === active.id);
                      const newIndex = sortedShoppingItems.findIndex((i) => i.id === over.id);
                      if (oldIndex === -1 || newIndex === -1) return;
                      const reordered = [...sortedShoppingItems];
                      const [removed] = reordered.splice(oldIndex, 1);
                      reordered.splice(newIndex, 0, removed);
                      setShoppingItems(reordered.map((i, idx) => ({ ...i, order: idx })));
                      handleShoppingReorder(reordered.map((i) => i.id));
                    }}
                  >
                    <SortableContext items={sortedShoppingItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-3">
                        {sortedShoppingItems.map((item, index) => {
                          const itemIndex = sortedShoppingItems.findIndex((i) => i.id === item.id);
                          const cat = item.category || 'uncategorized';
                          const showCategoryHeader = index === 0 || (sortedShoppingItems[index - 1]?.category || 'uncategorized') !== cat;
                          return (
                            <div key={item.id}>
                              {showCategoryHeader && (
                                <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-2 mt-4 first:mt-0">
                                  {CATEGORY_LABELS[cat]}
                                </h3>
                              )}
                              <SortableShoppingItemCard
                                item={item}
                                isEditing={editingItemId === item.id}
                                editName={editItemName}
                                editDescription={editItemDescription}
                                editLinks={editItemLinks}
                                editCategory={editItemCategory}
                                onEditNameChange={setEditItemName}
                                onEditDescriptionChange={setEditItemDescription}
                                onEditLinkChange={(index, url) => setEditItemLinks((prev) => prev.map((l, j) => (j === index ? { ...l, url } : l)))}
                                onEditLinkDescriptionChange={(index, description) => setEditItemLinks((prev) => prev.map((l, j) => (j === index ? { ...l, description } : l)))}
                                onEditCategoryChange={setEditItemCategory}
                                onEditAddLink={() => setEditItemLinks((prev) => [...prev, { url: '', description: '', linkPreview: null }])}
                                onEditRemoveLink={(index) => setEditItemLinks((prev) => prev.filter((_, j) => j !== index))}
                                onEditFetchPreview={(index) => fetchLinkPreview(editItemLinks[index]?.url || '', true, index)}
                                isFetchingEditPreviewIndex={isFetchingEditPreviewIndex}
                                onStartEdit={() => startEditItem(item)}
                                onCancelEdit={() => setEditingItemId(null)}
                                onSave={() => handleUpdateShoppingItem(item.id)}
                                onDelete={() => handleDeleteShoppingItem(item.id)}
                                canMoveUp={itemIndex > 0}
                                canMoveDown={itemIndex >= 0 && itemIndex < sortedShoppingItems.length - 1}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </SortableContext>
                  </DndContext>
                ) : null}
              </div>
            </section>
          </>
        )}

        {/* TIPS TAB */}
        {activeTab === 'tips' && (
          <section>
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h2 className="font-serif text-base md:text-lg text-stone-900">
                Tips {tips.length > 0 && <span className="text-stone-400">({tips.length})</span>}
              </h2>
              {!showAddTip && (
                <Button
                  onClick={() => setShowAddTip(true)}
                  variant="primary"
                  size="md"
                  className="gap-1.5"
                >
                  <Plus size={16} />
                  Add Tip
                </Button>
              )}
            </div>

            <div className="space-y-2">
              {showAddTip && (
                <div className="bg-white rounded-xl border border-sage-200 shadow-sm p-3 md:p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-serif text-base text-stone-900">New Tip</h3>
                    <Button
                      onClick={() => { setNewTipText(''); setShowAddTip(false); }}
                      variant="ghost"
                      size="icon"
                      aria-label="Cancel"
                    >
                      <X size={18} />
                    </Button>
                  </div>
                  <form onSubmit={handleAddTip} className="space-y-3">
                    <textarea
                      value={newTipText}
                      onChange={(e) => setNewTipText(e.target.value)}
                      placeholder="e.g. Try pairing with neutral accessories..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button type="submit" variant="primary" size="lg" className="rounded-full" disabled={!newTipText.trim() || isAddingTip}>
                        {isAddingTip ? 'Adding...' : 'Add Tip'}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => { setNewTipText(''); setShowAddTip(false); }}
                        variant="ghost"
                        size="md"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              )}
              {isLoadingTips ? (
                <div className="text-center py-12 text-stone-500">Loading…</div>
              ) : tips.length === 0 && !showAddTip ? (
                <div className="text-center py-12 text-stone-500 bg-white rounded-2xl border border-stone-100">
                  <Lightbulb size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-sm md:text-base">No tips yet. Add styling tips for your client.</p>
                </div>
              ) : (
                tips.map((tip, index) => (
                  <div
                    key={tip.id}
                    className="bg-white rounded-xl border border-stone-100 shadow-sm p-3 md:p-4 flex items-start gap-3"
                  >
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-sage-100 text-sage-700 text-sm font-semibold flex items-center justify-center">
                      {index + 1}
                    </span>
                    {editingTipId === tip.id ? (
                      <div className="flex-1 space-y-2">
                        <textarea
                          value={editTipText}
                          onChange={(e) => setEditTipText(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500"
                        />
                        <div className="flex gap-2">
                          <Button onClick={() => handleUpdateTip(tip.id)} variant="primary" size="md" className="gap-1.5">
                            <Save size={14} />
                            Save
                          </Button>
                          <Button onClick={() => setEditingTipId(null)} variant="ghost" size="md">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="flex-1 text-stone-700 text-sm md:text-base leading-relaxed">{normalizePastedText(tip.text)}</p>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            onClick={() => startEditTip(tip)}
                            variant="icon"
                            size="icon"
                            title="Edit"
                          >
                            <Edit3 size={16} />
                          </Button>
                          <Button
                            onClick={() => handleDeleteTip(tip.id)}
                            variant="icon-danger"
                            size="icon"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

// Upload Form Component
interface UploadFormProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  uploadFiles: File[];
  uploadPreview: string | null;
  uploadProgress: string | null;
  uploadTitle: string;
  uploadCaption: string;
  uploadSeason: Season | '';
  isUploading: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTitleChange: (value: string) => void;
  onCaptionChange: (value: string) => void;
  onSeasonChange: (value: Season | '') => void;
  onSubmit: (e: React.FormEvent) => void;
  onClearFile: () => void;
}

const UploadForm: React.FC<UploadFormProps> = ({
  fileInputRef,
  uploadFiles,
  uploadPreview,
  uploadProgress,
  uploadTitle,
  uploadCaption,
  uploadSeason,
  isUploading,
  onFileChange,
  onTitleChange,
  onCaptionChange,
  onSeasonChange,
  onSubmit,
  onClearFile,
}) => (
  <form onSubmit={onSubmit}>
    <div className="space-y-4">
      {/* File Input */}
      <div>
        <label htmlFor="upload-file" className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">
          Photo{uploadFiles.length > 1 ? 's' : ''}
        </label>
        <input
          ref={fileInputRef}
          id="upload-file"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/heic,image/heif,.heic,.heif"
          multiple
          onChange={onFileChange}
          className="hidden"
        />

        {uploadPreview || uploadFiles.length > 0 ? (
          <div className="relative inline-block min-h-[80px]">
            {uploadPreview && (
              <img src={uploadPreview} alt="Preview" className="h-40 md:h-32 w-auto rounded-xl object-cover" />
            )}
            {uploadFiles.length > 1 && (
              <p className="mt-2 text-sm text-stone-600">
                {uploadFiles.length} photos selected. Title and description apply to the whole set.
              </p>
            )}
            <Button
              type="button"
              onClick={onClearFile}
              variant="primary"
              size="icon"
              className="absolute -top-2 -right-2 h-7 w-7 bg-red-500 hover:bg-red-600 shadow-md"
              aria-label="Remove photos"
            >
              <X size={16} />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            size="lg"
            className="w-full md:w-auto gap-2 border-dashed border-2 border-stone-200 hover:border-sage-400"
          >
            <ImageIcon size={20} />
            <span>Choose photo(s)</span>
          </Button>
        )}
      </div>

      {/* Title */}
      <div>
        <label htmlFor="upload-title" className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">
          Title <span className="font-normal text-stone-400">(optional)</span>
        </label>
        <input
          id="upload-title"
          type="text"
          value={uploadTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent text-base font-serif"
          placeholder="e.g. Weekend brunch"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="upload-caption" className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">
          Description <span className="font-normal text-stone-400">(optional)</span>
        </label>
        <textarea
          id="upload-caption"
          value={uploadCaption}
          onChange={(e) => onCaptionChange(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent resize-none text-base"
          placeholder="Describe this outfit… Line breaks are kept."
        />
      </div>

      {/* Season */}
      <div>
        <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">
          Season <span className="font-normal text-stone-400">(optional)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {SEASON_ORDER.map((season) => (
            <Button
              key={season}
              type="button"
              onClick={() => onSeasonChange(uploadSeason === season ? '' : season)}
              variant={uploadSeason === season ? 'chip-selected' : 'chip'}
              size="sm"
              className="text-sm"
            >
              {SEASON_LABELS[season]}
            </Button>
          ))}
        </div>
      </div>
    </div>

    {uploadProgress && (
      <p className="text-sm text-stone-500">{uploadProgress}</p>
    )}
    <Button type="submit" variant="primary" size="lg" className="mt-4 w-full md:w-auto rounded-full" disabled={uploadFiles.length === 0 || isUploading}>
      {isUploading ? (uploadProgress || 'Uploading…') : uploadFiles.length > 1 ? `Add ${uploadFiles.length} photos` : 'Add to Lookbook'}
    </Button>
  </form>
);

// Single image thumbnail (loads by key, optional delete)
const EntryImageThumb: React.FC<{
  imageKey: string;
  slug: string;
  passcode: string;
  alt: string;
  onReplace?: () => void;
  onDelete?: () => void;
  isReplacing?: boolean;
}> = ({ imageKey, slug, passcode, alt, onReplace, onDelete, isReplacing }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let revoked = false;
    const fetchImage = async () => {
      try {
        const res = await fetch(`/.netlify/functions/cms-image?key=${encodeURIComponent(imageKey)}&slug=${slug}`, {
          headers: { 'X-Admin-Passcode': passcode },
        });
        if (res.ok && !revoked) {
          const blob = await res.blob();
          setImageUrl(URL.createObjectURL(blob));
        } else if (res.status === 404) {
          // Image key exists in entry but file is missing from storage - silently show fallback
          if (!revoked) setLoading(false);
        }
      } catch {
        // Network error - ignore
      } finally {
        if (!revoked) setLoading(false);
      }
    };
    fetchImage();
    return () => {
      revoked = true;
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageKey, slug, passcode]);

  if (loading || isReplacing) {
    return (
      <div className="aspect-square rounded-lg bg-stone-100 flex items-center justify-center">
        {isReplacing ? (
          <div className="h-6 w-6 border-2 border-sage-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          <ImageIcon size={20} className="text-stone-400" />
        )}
      </div>
    );
  }

  return (
    <div className="relative aspect-square rounded-lg overflow-hidden bg-stone-100 group">
      {imageUrl ? (
        <img src={imageUrl} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <ImageIcon size={20} className="text-stone-400" />
        </div>
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1">
        {onReplace && (
          <Button
            onClick={onReplace}
            variant="light"
            size="icon"
            className="p-1.5 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Replace photo"
          >
            <Camera size={14} />
          </Button>
        )}
        {onDelete && (
          <Button
            onClick={onDelete}
            variant="primary"
            size="icon"
            className="p-1.5 h-7 w-7 bg-red-500/90 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Remove photo"
          >
            <X size={14} />
          </Button>
        )}
      </div>
    </div>
  );
};

// Entry Card Component
interface EntryCardProps {
  entry: EditorialEntry;
  slug: string;
  passcode: string;
  isEditing: boolean;
  editTitle: string;
  editCaption: string;
  editSeason: Season | '';
  onEditTitleChange: (value: string) => void;
  onEditCaptionChange: (value: string) => void;
  onEditSeasonChange: (value: Season | '') => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  onReplacePhoto: (entryId: string, file: File) => Promise<void>;
  onAddPhoto: (entryId: string, file: File) => Promise<void>;
  onDeleteImage: (entryId: string, imageKey: string) => Promise<void>;
  /** When provided, shows drag handle instead of move up/down buttons */
  dragHandleProps?: { listeners: unknown; attributes: unknown };
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

const EntryCard: React.FC<EntryCardProps> = ({
  entry,
  slug,
  passcode,
  isEditing,
  editTitle,
  editCaption,
  editSeason,
  onEditTitleChange,
  onEditCaptionChange,
  onEditSeasonChange,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onReplacePhoto,
  onAddPhoto,
  onDeleteImage,
  dragHandleProps,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
}) => {
  const [isReplacing, setIsReplacing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  const imageKeys = (entry.imageKeys && entry.imageKeys.length > 0) ? entry.imageKeys : [entry.imageKey];

  const handleReplaceClick = () => replaceInputRef.current?.click();
  const handleAddClick = () => addInputRef.current?.click();

  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsReplacing(true);
    try {
      await onReplacePhoto(entry.id, file);
    } finally {
      setIsReplacing(false);
      if (replaceInputRef.current) replaceInputRef.current.value = '';
    }
  };

  const handleAddFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsAdding(true);
    try {
      await onAddPhoto(entry.id, file);
    } finally {
      setIsAdding(false);
      if (addInputRef.current) addInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white p-3 md:p-4 rounded-2xl border border-stone-100 shadow-sm">
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/heic,image/heif,.heic,.heif"
        onChange={handleReplaceFile}
        className="hidden"
      />
      <input
        ref={addInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/heic,image/heif,.heic,.heif"
        onChange={handleAddFile}
        className="hidden"
      />

      <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
        {/* Photo grid */}
        <div className="w-full sm:w-40 md:w-48 flex-shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
            {imageKeys.map((key) => (
              <EntryImageThumb
                key={key}
                imageKey={key}
                slug={slug}
                passcode={passcode}
                alt={entry.caption || 'Outfit'}
                onReplace={key === entry.imageKey ? handleReplaceClick : undefined}
                onDelete={imageKeys.length > 1 ? () => onDeleteImage(entry.id, key) : undefined}
                isReplacing={isReplacing && key === entry.imageKey}
              />
            ))}
            <Button
              type="button"
              onClick={handleAddClick}
              disabled={isAdding}
              variant="outline"
              className="aspect-square rounded-lg border-2 border-dashed border-stone-200 hover:border-sage-400 hover:text-sage-600 h-auto w-auto"
              aria-label="Add photo"
            >
              {isAdding ? (
                <div className="h-5 w-5 border-2 border-sage-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Plus size={24} />
              )}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div>
              <label htmlFor="edit-title" className="block text-xs font-medium text-stone-500 mb-1">Title</label>
              <input
                id="edit-title"
                type="text"
                value={editTitle}
                onChange={(e) => onEditTitleChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-900 text-base font-serif focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent mb-3"
                placeholder="Optional title"
              />
              <label htmlFor="edit-caption" className="block text-xs font-medium text-stone-500 mb-1">Description</label>
              <textarea
                id="edit-caption"
                value={editCaption}
                onChange={(e) => onEditCaptionChange(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 text-base focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent resize-none"
                placeholder="Description (line breaks kept)"
              />
              {/* Season selector */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {SEASON_ORDER.map((season) => (
                  <Button
                    key={season}
                    type="button"
                    onClick={() => onEditSeasonChange(editSeason === season ? '' : season)}
                    variant={editSeason === season ? 'chip-selected' : 'chip'}
                    size="sm"
                    className="text-xs"
                  >
                    {SEASON_LABELS[season]}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <Button onClick={onSave} variant="primary" size="md" className="flex-1 sm:flex-none gap-1.5">
                  <Save size={16} />
                  Save
                </Button>
                <Button onClick={onCancelEdit} variant="ghost" size="md" className="flex-1 sm:flex-none gap-1.5">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-start gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-lg md:text-xl text-stone-900 mb-1">
                  {entry.title ? normalizePastedText(entry.title) : <span className="italic text-stone-400">No title</span>}
                </h3>
                <p className="font-sans text-stone-600 text-sm whitespace-pre-wrap line-clamp-3">
                  {entry.caption ? normalizePastedText(entry.caption) : <span className="italic text-stone-400">No description</span>}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-stone-400 text-xs">{new Date(entry.createdAt).toLocaleDateString()}</p>
                  {entry.season && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-sage-50 text-sage-700">
                      {SEASON_LABELS[entry.season]}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex sm:flex-col gap-2">
                <div className="flex gap-1 sm:flex-col sm:gap-1">
                  {dragHandleProps ? (
                    <span
                      {...(dragHandleProps.listeners as Record<string, unknown>)}
                      {...(dragHandleProps.attributes as Record<string, unknown>)}
                      className="p-2 rounded-lg bg-stone-50 text-stone-500 hover:text-sage-600 hover:bg-sage-50 transition-colors cursor-grab active:cursor-grabbing touch-none inline-flex"
                      aria-label="Drag to reorder"
                    >
                      <GripVertical size={18} />
                    </span>
                  ) : (
                    <>
                      <Button
                        type="button"
                        onClick={onMoveUp}
                        disabled={!canMoveUp}
                        variant="icon"
                        size="icon"
                        className="bg-stone-50 rounded-lg"
                        aria-label="Move up"
                      >
                        <ChevronUp size={18} />
                      </Button>
                      <Button
                        type="button"
                        onClick={onMoveDown}
                        disabled={!canMoveDown}
                        variant="icon"
                        size="icon"
                        className="bg-stone-50 rounded-lg"
                        aria-label="Move down"
                      >
                        <ChevronDown size={18} />
                      </Button>
                    </>
                  )}
                </div>
                <Button
                  onClick={handleReplaceClick}
                  disabled={isReplacing}
                  variant="icon"
                  size="icon"
                  className="flex-1 sm:flex-none gap-1.5 px-3 py-2 sm:p-2 rounded-xl sm:rounded-lg bg-stone-50 sm:bg-transparent h-auto sm:h-9"
                  aria-label="Replace photo"
                >
                  <Camera size={18} />
                  <span className="text-sm sm:hidden">Photo</span>
                </Button>
                <Button
                  onClick={onStartEdit}
                  variant="icon"
                  size="icon"
                  className="flex-1 sm:flex-none gap-1.5 px-3 py-2 sm:p-2 rounded-xl sm:rounded-lg bg-stone-50 sm:bg-transparent h-auto sm:h-9"
                  aria-label="Edit caption"
                >
                  <Edit3 size={18} />
                  <span className="text-sm sm:hidden">Edit</span>
                </Button>
                <Button
                  onClick={onDelete}
                  variant="icon-danger"
                  size="icon"
                  className="flex-1 sm:flex-none gap-1.5 px-3 py-2 sm:p-2 rounded-xl sm:rounded-lg bg-stone-50 sm:bg-transparent h-auto sm:h-9"
                  aria-label="Delete entry"
                >
                  <Trash2 size={18} />
                  <span className="text-sm sm:hidden">Delete</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Sortable wrapper for EntryCard (drag-and-drop reorder)
const SortableEntryCard: React.FC<EntryCardProps> = (props) => {
  const { entry } = props;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-60 z-10' : undefined}>
      <EntryCard
        {...props}
        dragHandleProps={{ listeners, attributes }}
      />
    </div>
  );
};

// Shopping Item Form Component
type ShoppingItemLinkRow = { url: string; description: string; linkPreview: LinkPreview | null };
interface ShoppingItemFormProps {
  name: string;
  description: string;
  links: ShoppingItemLinkRow[];
  category: ShoppingCategory;
  isFetchingPreviewIndex: number | null;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onLinkChange: (index: number, url: string) => void;
  onLinkDescriptionChange: (index: number, description: string) => void;
  onCategoryChange: (value: ShoppingCategory) => void;
  onFetchPreview: (index: number) => void;
  onAddLink: () => void;
  onRemoveLink: (index: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  submitLabel: string;
  onCancel?: () => void;
}

const ShoppingItemForm: React.FC<ShoppingItemFormProps> = ({
  name,
  description,
  links,
  category,
  isFetchingPreviewIndex,
  onNameChange,
  onDescriptionChange,
  onLinkChange,
  onLinkDescriptionChange,
  onCategoryChange,
  onFetchPreview,
  onAddLink,
  onRemoveLink,
  onSubmit,
  isSubmitting,
  submitLabel,
  onCancel,
}) => {
  const [showOptional, setShowOptional] = React.useState(true);
  const hasAnyLink = links.some((l) => l.url.trim());

  return (
    <form onSubmit={onSubmit}>
      <div className="space-y-4">
        {/* Category pills */}
        <div>
          <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_ORDER.map((cat) => (
              <Button
                key={cat}
                type="button"
                onClick={() => onCategoryChange(cat)}
                variant={category === cat ? 'chip-selected' : 'chip'}
                size="sm"
                className="text-sm"
              >
                {CATEGORY_LABELS[cat]}
              </Button>
            ))}
          </div>
        </div>

        {/* Name - Primary required field */}
        <div>
          <label htmlFor="item-name" className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">
            Item Name
          </label>
          <input
            id="item-name"
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className="w-full h-11 px-4 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent text-base"
            placeholder="e.g., Navy blazer"
            required
            autoFocus
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="item-description" className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">
            Description <span className="font-normal text-stone-400">(optional)</span>
          </label>
          <input
            id="item-description"
            type="text"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            className="w-full h-11 px-4 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent text-base"
            placeholder="Size, color, styling notes…"
          />
        </div>

        {/* Toggle for optional fields */}
        {!showOptional && !hasAnyLink && (
          <Button
            type="button"
            onClick={() => setShowOptional(true)}
            variant="ghost"
            size="sm"
            className="text-sage-600 hover:text-sage-700"
          >
            + Add product link
          </Button>
        )}

        {/* Optional fields */}
        {(showOptional || hasAnyLink) && (
          <>
            {/* Product links (multiple) - auto-fetch preview on blur */}
            <div className="space-y-4">
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">
                Product Link(s) <span className="font-normal text-stone-400">(optional)</span>
              </label>
              {links.map((linkRow, index) => (
                <div key={index} className="space-y-3 p-4 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="url"
                      value={linkRow.url}
                      onChange={(e) => onLinkChange(index, e.target.value)}
                      onBlur={() => linkRow.url && linkRow.url.startsWith('http') && onFetchPreview(index)}
                      className="flex-1 h-11 px-4 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent text-base"
                      placeholder="https://..."
                    />
                    <div className="flex gap-2">
                    {links.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => onRemoveLink(index)}
                        variant="icon-danger"
                        size="icon"
                        className="h-11 w-11 rounded-xl bg-stone-100"
                        aria-label="Remove link"
                      >
                        <X size={18} />
                      </Button>
                    )}
                  </div>
                  </div>
                  
                  {/* Link description */}
                  <input
                    type="text"
                    value={linkRow.description}
                    onChange={(e) => onLinkDescriptionChange(index, e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent text-base"
                    placeholder="Link description (optional)"
                  />
                  {linkRow.linkPreview && (
                    <div className="mt-3 p-3 bg-white rounded-xl border border-stone-200 flex gap-3">
                      {linkRow.linkPreview.image && (
                        <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-stone-200">
                          <img src={linkRow.linkPreview.image} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-stone-900 text-sm line-clamp-2">{linkRow.linkPreview.title || 'No title'}</p>
                        <span className="text-xs text-stone-400">{linkRow.linkPreview.siteName || new URL(linkRow.linkPreview.url).hostname}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <Button
                type="button"
                onClick={onAddLink}
                variant="outline"
                size="lg"
                fullWidth
                className="gap-2 border-dashed border-2 border-stone-300 hover:border-stone-400 text-sage-600"
              >
                <Plus size={16} />
                Add another link
              </Button>
            </div>

          </>
        )}
      </div>

      <div className="flex gap-2 mt-4">
        <Button type="submit" variant="primary" size="md" className="flex-1 md:flex-none" disabled={!name.trim() || isSubmitting}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" onClick={onCancel} variant="ghost" size="md" className="flex-1 md:flex-none">
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};

// Shopping Item Card Component
interface ShoppingItemCardProps {
  item: ShoppingItem;
  isEditing: boolean;
  editName: string;
  editDescription: string;
  editLinks: { url: string; description: string; linkPreview: LinkPreview | null }[];
  editCategory: ShoppingCategory;
  onEditNameChange: (value: string) => void;
  onEditDescriptionChange: (value: string) => void;
  onEditLinkChange: (index: number, url: string) => void;
  onEditLinkDescriptionChange: (index: number, description: string) => void;
  onEditCategoryChange: (value: ShoppingCategory) => void;
  onEditAddLink: () => void;
  onEditRemoveLink: (index: number) => void;
  onEditFetchPreview: (index: number) => void;
  isFetchingEditPreviewIndex: number | null;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  /** When provided, shows drag handle instead of move up/down buttons */
  dragHandleProps?: { listeners: unknown; attributes: unknown };
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

const ShoppingItemCard: React.FC<ShoppingItemCardProps> = ({
  item,
  isEditing,
  editName,
  editDescription,
  editLinks,
  editCategory,
  onEditNameChange,
  onEditDescriptionChange,
  onEditLinkChange,
  onEditLinkDescriptionChange,
  onEditCategoryChange,
  onEditAddLink,
  onEditRemoveLink,
  onEditFetchPreview,
  isFetchingEditPreviewIndex,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
  dragHandleProps,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
}) => {
  return (
    <div className="bg-white p-3 md:p-4 rounded-2xl border border-stone-100 shadow-sm">
      {isEditing ? (
        <ShoppingItemForm
          name={editName}
          description={editDescription}
          links={editLinks}
          category={editCategory}
          isFetchingPreviewIndex={isFetchingEditPreviewIndex}
          onNameChange={onEditNameChange}
          onDescriptionChange={onEditDescriptionChange}
          onLinkChange={onEditLinkChange}
          onLinkDescriptionChange={onEditLinkDescriptionChange}
          onCategoryChange={onEditCategoryChange}
          onFetchPreview={onEditFetchPreview}
          onAddLink={onEditAddLink}
          onRemoveLink={onEditRemoveLink}
          onSubmit={(e) => { e.preventDefault(); onSave(); }}
          isSubmitting={false}
          submitLabel="Save Changes"
          onCancel={onCancelEdit}
        />
      ) : (
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Image or Icon */}
          {item.linkPreview?.image ? (
            <div className="w-full sm:w-20 h-32 sm:h-20 flex-shrink-0 rounded-xl overflow-hidden bg-stone-100">
              <img
                src={item.linkPreview.image}
                alt={item.name}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          ) : (
            <div className="hidden sm:flex w-12 h-12 flex-shrink-0 rounded-xl bg-sage-50 items-center justify-center text-sage-500">
              <ShoppingBag size={20} />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <h3 className="font-medium text-stone-900 text-base">{item.name}</h3>
            </div>
            {item.description && (
              <p className="text-stone-500 text-sm mt-1 line-clamp-2">{item.description}</p>
            )}
            
            {/* Multiple Links */}
            {item.links && item.links.length > 0 && (
              <div className="mt-2 space-y-2">
                {item.links.map((link, index) => (
                  <div key={index} className="border-t border-stone-200 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-stone-400 text-sm">
                        {link.linkPreview?.favicon && (
                          <img
                            src={link.linkPreview.favicon}
                            alt=""
                            className="w-4 h-4"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        )}
                        <span className="truncate max-w-[120px]">
                          {link.linkPreview?.siteName || (() => {
                            try { return new URL(link.url).hostname.replace('www.', ''); } catch { return 'Shop'; }
                          })()}
                        </span>
                      </div>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sage-600 text-sm hover:underline truncate max-w-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {link.linkPreview?.siteName || new URL(link.url).hostname}
                      </a>
                    </div>
                    {/* Link description */}
                    {link.description && (
                      <p className="text-stone-600 text-sm mt-1 line-clamp-2">
                        {link.description}
                      </p>
                    )}
                    {/* Full URL display */}
                    <p className="text-xs text-stone-400 break-all">
                      {link.url}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Single Link (fallback for backward compatibility) */}
            {!item.links || item.links.length === 0 ? (
              <>
                {item.link && (
                  <div className="flex items-center gap-2 mt-2">
                    {item.linkPreview?.favicon && (
                      <img
                        src={item.linkPreview.favicon}
                        alt=""
                        className="w-4 h-4"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sage-600 text-sm hover:underline truncate max-w-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {item.linkPreview?.siteName || new URL(item.link).hostname}
                    </a>
                  </div>
                )}
                {/* Full URL display */}
                {item.link && (
                  <p className="text-xs text-stone-400 break-all mt-2">
                    {item.link}
                  </p>
                )}
              </>
            ) : null}
          </div>

          {/* Actions */}
          <div className="flex sm:flex-col gap-2">
            <div className="flex gap-1 sm:flex-col sm:gap-1">
              {dragHandleProps ? (
                <span
                  {...(dragHandleProps.listeners as Record<string, unknown>)}
                  {...(dragHandleProps.attributes as Record<string, unknown>)}
                  className="p-2 rounded-lg bg-stone-50 text-stone-500 hover:text-sage-600 hover:bg-sage-50 transition-colors cursor-grab active:cursor-grabbing touch-none inline-flex"
                  aria-label="Drag to reorder"
                >
                  <GripVertical size={18} />
                </span>
              ) : (
                <>
                  <Button
                    type="button"
                    onClick={onMoveUp}
                    disabled={!canMoveUp}
                    variant="icon"
                    size="icon"
                    className="bg-stone-50 rounded-lg"
                    aria-label="Move up"
                  >
                    <ChevronUp size={18} />
                  </Button>
                  <Button
                    type="button"
                    onClick={onMoveDown}
                    disabled={!canMoveDown}
                    variant="icon"
                    size="icon"
                    className="bg-stone-50 rounded-lg"
                    aria-label="Move down"
                  >
                    <ChevronDown size={18} />
                  </Button>
                </>
              )}
            </div>
            <Button
              onClick={onStartEdit}
              variant="icon"
              size="icon"
              className="flex-1 sm:flex-none gap-1.5 px-3 py-2 sm:p-2 rounded-xl sm:rounded-lg bg-stone-50 sm:bg-transparent h-auto sm:h-9"
              aria-label="Edit item"
            >
              <Edit3 size={18} />
              <span className="text-sm sm:hidden">Edit</span>
            </Button>
            <Button
              onClick={onDelete}
              variant="icon-danger"
              size="icon"
              className="flex-1 sm:flex-none gap-1.5 px-3 py-2 sm:p-2 rounded-xl sm:rounded-lg bg-stone-50 sm:bg-transparent h-auto sm:h-9"
              aria-label="Delete item"
            >
              <Trash2 size={18} />
              <span className="text-sm sm:hidden">Delete</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Sortable wrapper for ShoppingItemCard (drag-and-drop reorder)
const SortableShoppingItemCard: React.FC<ShoppingItemCardProps> = (props) => {
  const { item } = props;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-60 z-10' : undefined}>
      <ShoppingItemCard
        {...props}
        dragHandleProps={{ listeners, attributes }}
      />
    </div>
  );
};
