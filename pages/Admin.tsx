import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Lock, Upload, Trash2, Edit3, Save, X, LogOut, Image as ImageIcon, ArrowLeft, Plus, Users, Copy, Check, FolderOpen, Eye, Camera, ShoppingBag, ExternalLink, DollarSign, Link2, Square, CheckSquare } from 'lucide-react';
import { Button } from '../components/ui/Button';

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
  caption: string;
  order: number;
  createdAt: string;
  season?: Season;
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

type ShoppingCategory = 'tops' | 'bottoms' | 'accessories' | 'uncategorized';

const CATEGORY_LABELS: Record<ShoppingCategory, string> = {
  tops: 'Tops',
  bottoms: 'Bottoms',
  accessories: 'Accessories',
  uncategorized: 'Other',
};

const CATEGORY_ORDER: ShoppingCategory[] = ['tops', 'bottoms', 'accessories', 'uncategorized'];

interface ShoppingItem {
  id: string;
  name: string;
  description?: string;
  link?: string;
  price?: string;
  linkPreview?: LinkPreview;
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

const PASSCODE_KEY = 'admin_passcode';

export const Admin: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
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
        setAuthError('Invalid passcode');
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
            <p className="text-stone-500 text-sm">Enter your passcode to manage lookbooks</p>
          </div>

          <form onSubmit={handleAuthSubmit} className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
            <div className="mb-4">
              <label htmlFor="passcode" className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">
                Passcode
              </label>
              <input
                id="passcode"
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full h-11 px-4 rounded-lg border border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent"
                placeholder="Enter passcode"
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
    return <LookbookEditor slug={slug} onLogout={handleLogout} />;
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
  const [newSeason, setNewSeason] = useState<Season>(getCurrentSeason());
  const [isCreating, setIsCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedSeasonFilter, setSelectedSeasonFilter] = useState<Season | 'all'>('all');

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
          description: newDescription.trim() || undefined,
          season: newSeason 
        }),
      });

      if (res.ok) {
        const newLookbook = await res.json();
        setLookbooks([newLookbook, ...lookbooks]);
        setNewTitle('');
        setNewDescription('');
        setNewSeason(getCurrentSeason());
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

  const copyToClipboard = async (lookbook: Lookbook) => {
    const url = `${window.location.origin}/lookbook/${lookbook.slug}`;
    const text = `Your Style Lookbook\nURL: ${url}\nPasscode: ${lookbook.passcode}`;
    
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(lookbook.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback for older browsers
      alert(`URL: ${url}\nPasscode: ${lookbook.passcode}`);
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
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 md:gap-2 text-sm text-stone-500 hover:text-red-600 transition-colors cursor-pointer p-1"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Log out</span>
          </button>
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
              <div className="mb-4">
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">
                  Season
                </label>
                <div className="flex flex-wrap gap-2">
                  {SEASON_ORDER.map((season) => (
                    <button
                      key={season}
                      type="button"
                      onClick={() => setNewSeason(season)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                        newSeason === season
                          ? 'bg-sage-500 text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {SEASON_LABELS[season]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="primary" size="md" className="rounded-full" disabled={!newClientName.trim() || isCreating}>
                  {isCreating ? 'Creating…' : 'Create Lookbook'}
                </Button>
                <button
                  type="button"
                  onClick={() => { setShowCreateForm(false); setNewClientName(''); setNewTitle(''); setNewDescription(''); setNewSeason(getCurrentSeason()); }}
                  className="px-4 py-2 rounded-full bg-stone-100 text-stone-600 text-sm font-medium hover:bg-stone-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 mb-6 rounded-full bg-sage-500 text-white font-medium hover:bg-sage-600 transition-colors cursor-pointer shadow-sm"
          >
            <Plus size={20} />
            New Client Lookbook
          </button>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm" role="alert">
            {error}
          </div>
        )}

        {/* Lookbooks List */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="font-serif text-base md:text-lg text-stone-900 flex items-center gap-2">
              <FolderOpen size={18} className="text-stone-400" />
              Client Lookbooks {lookbooks.length > 0 && <span className="text-stone-400">({lookbooks.length})</span>}
            </h2>
            {/* Season Filter */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedSeasonFilter('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  selectedSeasonFilter === 'all'
                    ? 'bg-stone-800 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                All
              </button>
              {SEASON_ORDER.map((season) => (
                <button
                  key={season}
                  onClick={() => setSelectedSeasonFilter(season)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                    selectedSeasonFilter === season
                      ? 'bg-stone-800 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {SEASON_LABELS[season]}
                </button>
              ))}
            </div>
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
              {lookbooks
                .filter((lookbook) => selectedSeasonFilter === 'all' || lookbook.season === selectedSeasonFilter)
                .map((lookbook) => (
                <div
                  key={lookbook.id}
                  className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm hover:border-sage-200 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => navigate(`/admin/${lookbook.slug}`)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-stone-900 text-base">{lookbook.clientName}</h3>
                        {lookbook.season && (
                          <span className="text-xs px-2 py-1 rounded-full bg-sage-50 text-sage-700">
                            {SEASON_LABELS[lookbook.season]}
                          </span>
                        )}
                      </div>
                      <p className="text-stone-400 text-sm mt-0.5">
                        /lookbook/{lookbook.slug}
                      </p>
                      <div className="flex items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                        <span className="text-xs text-stone-500 bg-stone-100 px-2 py-1 rounded-full font-mono">
                          {lookbook.passcode}
                        </span>
                        <button
                          onClick={() => copyToClipboard(lookbook)}
                          className="text-xs text-sage-600 hover:text-sage-700 flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === lookbook.id ? <Check size={14} /> : <Copy size={14} />}
                          {copiedId === lookbook.id ? 'Copied!' : 'Copy link & code'}
                        </button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => window.open(`/lookbook/${lookbook.slug}`, '_blank')}
                        className="p-2.5 rounded-full bg-stone-100 text-stone-500 hover:text-sage-600 hover:bg-sage-50 transition-colors cursor-pointer"
                        aria-label="Preview lookbook"
                        title="Preview lookbook"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(lookbook.slug, lookbook.clientName)}
                        className="p-2.5 rounded-full bg-stone-100 text-stone-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        aria-label="Delete lookbook"
                      >
                        <Trash2 size={18} />
                      </button>
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
interface LookbookEditorProps {
  slug: string;
  onLogout: () => void;
}

const LookbookEditor: React.FC<LookbookEditorProps> = ({ slug, onLogout }) => {
  const navigate = useNavigate();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'looks' | 'shopping' | 'links'>('looks');
  
  // CMS state
  const [entries, setEntries] = useState<EditorialEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [lookbookInfo, setLookbookInfo] = useState<{ clientName: string; passcode: string } | null>(null);

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadSeason, setUploadSeason] = useState<Season | ''>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
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
  const [newItemLink, setNewItemLink] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemLinkPreview, setNewItemLinkPreview] = useState<LinkPreview | null>(null);
  const [newItemCategory, setNewItemCategory] = useState<ShoppingCategory>('uncategorized');
  const [isFetchingPreview, setIsFetchingPreview] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemDescription, setEditItemDescription] = useState('');
  const [editItemLink, setEditItemLink] = useState('');
  const [editItemPrice, setEditItemPrice] = useState('');
  const [editItemCategory, setEditItemCategory] = useState<ShoppingCategory>('uncategorized');
  const [editItemLinkPreview, setEditItemLinkPreview] = useState<LinkPreview | null>(null);
  const [isFetchingEditPreview, setIsFetchingEditPreview] = useState(false);

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

  useEffect(() => {
    fetchLookbookInfo();
    fetchEntries();
    fetchShoppingItems();
    fetchShoppingLinks();
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUploadPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('caption', uploadCaption);
      formData.append('slug', slug);
      if (uploadSeason) {
        formData.append('season', uploadSeason);
      }

      const res = await fetch('/.netlify/functions/cms-upload', {
        method: 'POST',
        headers: { 'X-Admin-Passcode': sessionStorage.getItem(PASSCODE_KEY) || '' },
        body: formData,
      });

      if (res.ok) {
        const newEntry = await res.json();
        setEntries([...entries, newEntry]);
        resetUploadForm();
      } else {
        const data = await res.json();
        setError(data.error || 'Upload failed');
      }
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
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
    setEditCaption(entry.caption);
    setEditSeason(entry.season || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditCaption('');
    setEditSeason('');
  };

  const handleUpdate = async (id: string) => {
    try {
      const res = await fetch('/.netlify/functions/cms-update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': sessionStorage.getItem(PASSCODE_KEY) || '',
        },
        body: JSON.stringify({ slug, id, caption: editCaption, season: editSeason || null }),
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
      const formData = new FormData();
      formData.append('file', file);
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
          link: newItemLink,
          price: newItemPrice,
          linkPreview: newItemLinkPreview,
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
    setNewItemLink('');
    setNewItemPrice('');
    setNewItemLinkPreview(null);
    setNewItemCategory('uncategorized');
    setShowAddItem(false);
  };

  const fetchLinkPreview = async (url: string, isEdit = false) => {
    if (!url || !url.startsWith('http')) return;

    if (isEdit) {
      setIsFetchingEditPreview(true);
    } else {
      setIsFetchingPreview(true);
    }

    try {
      const res = await fetch(`/.netlify/functions/fetch-link-preview?url=${encodeURIComponent(url)}`, {
        headers: { 'X-Admin-Passcode': sessionStorage.getItem(PASSCODE_KEY) || '' },
      });

      if (res.ok) {
        const preview = await res.json();
        if (!preview.error) {
          if (isEdit) {
            setEditItemLinkPreview(preview);
            // Auto-fill name if empty
            if (!editItemName && preview.title) {
              setEditItemName(preview.title);
            }
          } else {
            setNewItemLinkPreview(preview);
            // Auto-fill name if empty
            if (!newItemName && preview.title) {
              setNewItemName(preview.title);
            }
          }
        }
      }
    } catch {
      // Ignore preview fetch errors
    } finally {
      if (isEdit) {
        setIsFetchingEditPreview(false);
      } else {
        setIsFetchingPreview(false);
      }
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
          link: editItemLink,
          price: editItemPrice,
          linkPreview: editItemLinkPreview,
          category: editItemCategory,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setShoppingItems(shoppingItems.map((i) => (i.id === id ? updated : i)));
        setEditingItemId(null);
        setEditItemLinkPreview(null);
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
    setEditItemLink(item.link || '');
    setEditItemPrice(item.price || '');
    setEditItemCategory(item.category || 'uncategorized');
    setEditItemLinkPreview(item.linkPreview || null);
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
            <button
              onClick={() => navigate('/admin')}
              className="text-stone-500 hover:text-sage-600 transition-colors p-1 cursor-pointer"
              aria-label="Back to lookbooks"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="font-serif text-lg md:text-xl text-stone-900">
                {lookbookInfo?.clientName || 'Lookbook'}
              </h1>
              {lookbookInfo && (
                <p className="text-xs text-stone-400 mt-0.5">Passcode: {lookbookInfo.passcode}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.open(`/lookbook/${slug}`, '_blank')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sage-50 text-sage-600 text-sm font-medium hover:bg-sage-100 transition-colors cursor-pointer"
              title="Preview lookbook"
            >
              <Eye size={16} />
              <span className="hidden sm:inline">Preview</span>
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 md:gap-2 text-sm text-stone-500 hover:text-red-600 transition-colors cursor-pointer p-1"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-stone-100">
        <div className="px-4 max-w-4xl mx-auto flex gap-1">
          <button
            onClick={() => setActiveTab('looks')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'looks'
                ? 'border-sage-500 text-sage-600'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <ImageIcon size={16} />
              Looks {entries.length > 0 && `(${entries.length})`}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('shopping')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'shopping'
                ? 'border-sage-500 text-sage-600'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <ShoppingBag size={16} />
              Shopping List {shoppingItems.length > 0 && `(${shoppingItems.length})`}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('links')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'links'
                ? 'border-sage-500 text-sage-600'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <Link2 size={16} />
              Links {shoppingLinks.length > 0 && `(${shoppingLinks.length})`}
            </span>
          </button>
        </div>
      </div>

      <main className="px-4 py-4 md:py-8 max-w-4xl mx-auto">
        {/* Mobile: Floating Add Button */}
        {activeTab === 'looks' && (
          <button
            onClick={() => setShowUploadForm(true)}
            className="md:hidden fixed bottom-6 right-6 z-20 h-14 w-14 rounded-full bg-sage-500 text-white shadow-lg flex items-center justify-center hover:bg-sage-600 active:scale-95 transition-all cursor-pointer"
            aria-label="Add new outfit"
          >
            <Plus size={28} />
          </button>
        )}
        {activeTab === 'shopping' && (
          <button
            onClick={() => setShowAddItem(true)}
            className="md:hidden fixed bottom-6 right-6 z-20 h-14 w-14 rounded-full bg-sage-500 text-white shadow-lg flex items-center justify-center hover:bg-sage-600 active:scale-95 transition-all cursor-pointer"
            aria-label="Add shopping item"
          >
            <Plus size={28} />
          </button>
        )}
        {activeTab === 'links' && (
          <button
            onClick={() => setShowAddLink(true)}
            className="md:hidden fixed bottom-6 right-6 z-20 h-14 w-14 rounded-full bg-sage-500 text-white shadow-lg flex items-center justify-center hover:bg-sage-600 active:scale-95 transition-all cursor-pointer"
            aria-label="Add shopping link"
          >
            <Plus size={28} />
          </button>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 md:mb-6 p-3 md:p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm" role="alert">
            {error}
          </div>
        )}

        {/* LOOKS TAB */}
        {activeTab === 'looks' && (
          <>
            {/* Mobile: Upload Modal */}
            {showUploadForm && (
              <div className="md:hidden fixed inset-0 z-30 bg-black/50 flex items-end">
                <div className="bg-white w-full rounded-t-3xl p-5 pb-8 max-h-[85vh] overflow-y-auto animate-slide-up">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-serif text-lg text-stone-900">Add New Outfit</h2>
                    <button
                      onClick={resetUploadForm}
                      className="p-2 -mr-2 text-stone-400 hover:text-stone-600 cursor-pointer"
                      aria-label="Close"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <UploadForm
                    fileInputRef={fileInputRef}
                    uploadFile={uploadFile}
                    uploadPreview={uploadPreview}
                    uploadCaption={uploadCaption}
                    uploadSeason={uploadSeason}
                    isUploading={isUploading}
                    onFileChange={handleFileChange}
                    onCaptionChange={setUploadCaption}
                    onSeasonChange={setUploadSeason}
                    onSubmit={handleUpload}
                    onClearFile={() => {
                      setUploadFile(null);
                      setUploadPreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  />
                </div>
              </div>
            )}

            {/* Desktop: Upload Form */}
            <section className="hidden md:block bg-white p-6 rounded-2xl border border-stone-100 shadow-sm mb-8">
              <h2 className="font-serif text-lg text-stone-900 mb-4 flex items-center gap-2">
                <Upload size={20} className="text-sage-600" />
                Add New Outfit
              </h2>
              <UploadForm
                fileInputRef={fileInputRef}
                uploadFile={uploadFile}
                uploadPreview={uploadPreview}
                uploadCaption={uploadCaption}
                uploadSeason={uploadSeason}
                isUploading={isUploading}
                onFileChange={handleFileChange}
                onCaptionChange={setUploadCaption}
                onSeasonChange={setUploadSeason}
                onSubmit={handleUpload}
                onClearFile={() => {
                  setUploadFile(null);
                  setUploadPreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
              />
            </section>

            {/* Entries List */}
            <section>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 md:mb-4">
                <h2 className="font-serif text-base md:text-lg text-stone-900">
                  Lookbook Entries {entries.length > 0 && <span className="text-stone-400">({entries.length})</span>}
                </h2>
                {/* Season Filter for entries */}
                {entries.some(e => e.season) && (
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setSelectedEntrySeason('all')}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                        selectedEntrySeason === 'all'
                          ? 'bg-stone-800 text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      All
                    </button>
                    {SEASON_ORDER.map((season) => (
                      <button
                        key={season}
                        onClick={() => setSelectedEntrySeason(season)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                          selectedEntrySeason === season
                            ? 'bg-stone-800 text-white'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                        {SEASON_LABELS[season]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {isLoading ? (
                <div className="text-center py-12 text-stone-500">Loading…</div>
              ) : entries.length === 0 ? (
                <div className="text-center py-12 text-stone-500 bg-white rounded-2xl border border-stone-100">
                  <ImageIcon size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-sm md:text-base">No entries yet. Upload the first outfit.</p>
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4">
                  {entries
                    .filter((entry) => selectedEntrySeason === 'all' || entry.season === selectedEntrySeason)
                    .map((entry) => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      slug={slug}
                      passcode={sessionStorage.getItem(PASSCODE_KEY) || ''}
                      isEditing={editingId === entry.id}
                      editCaption={editCaption}
                      editSeason={editSeason}
                      onEditCaptionChange={setEditCaption}
                      onEditSeasonChange={setEditSeason}
                      onStartEdit={() => startEdit(entry)}
                      onCancelEdit={cancelEdit}
                      onSave={() => handleUpdate(entry.id)}
                      onDelete={() => handleDelete(entry.id)}
                      onReplacePhoto={handleReplacePhoto}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* SHOPPING TAB */}
        {activeTab === 'shopping' && (
          <>
            {/* Mobile: Add Item Modal */}
            {showAddItem && (
              <div className="md:hidden fixed inset-0 z-30 bg-black/50 flex items-end">
                <div className="bg-white w-full rounded-t-3xl p-5 pb-8 max-h-[85vh] overflow-y-auto animate-slide-up">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-serif text-lg text-stone-900">Add Shopping Item</h2>
                    <button
                      onClick={resetAddItemForm}
                      className="p-2 -mr-2 text-stone-400 hover:text-stone-600 cursor-pointer"
                      aria-label="Close"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <ShoppingItemForm
                    name={newItemName}
                    description={newItemDescription}
                    link={newItemLink}
                    price={newItemPrice}
                    category={newItemCategory}
                    linkPreview={newItemLinkPreview}
                    isFetchingPreview={isFetchingPreview}
                    onNameChange={setNewItemName}
                    onDescriptionChange={setNewItemDescription}
                    onLinkChange={setNewItemLink}
                    onPriceChange={setNewItemPrice}
                    onCategoryChange={setNewItemCategory}
                    onFetchPreview={() => fetchLinkPreview(newItemLink, false)}
                    onSubmit={handleAddShoppingItem}
                    isSubmitting={isAddingItem}
                    submitLabel="Add Item"
                  />
                </div>
              </div>
            )}

            {/* Desktop: Add Item Form */}
            <section className="hidden md:block bg-white p-6 rounded-2xl border border-stone-100 shadow-sm mb-8">
              <h2 className="font-serif text-lg text-stone-900 mb-4 flex items-center gap-2">
                <ShoppingBag size={20} className="text-sage-600" />
                Add Shopping Item
              </h2>
              <ShoppingItemForm
                name={newItemName}
                description={newItemDescription}
                link={newItemLink}
                price={newItemPrice}
                category={newItemCategory}
                linkPreview={newItemLinkPreview}
                isFetchingPreview={isFetchingPreview}
                onNameChange={setNewItemName}
                onDescriptionChange={setNewItemDescription}
                onLinkChange={setNewItemLink}
                onPriceChange={setNewItemPrice}
                onCategoryChange={setNewItemCategory}
                onFetchPreview={() => fetchLinkPreview(newItemLink, false)}
                onSubmit={handleAddShoppingItem}
                isSubmitting={isAddingItem}
                submitLabel="Add to List"
              />
            </section>

            {/* Shopping Items List - Grouped by Category */}
            <section>
              <h2 className="font-serif text-base md:text-lg text-stone-900 mb-3 md:mb-4">
                Shopping Items {shoppingItems.length > 0 && <span className="text-stone-400">({shoppingItems.length})</span>}
              </h2>

              {isLoadingShopping ? (
                <div className="text-center py-12 text-stone-500">Loading…</div>
              ) : shoppingItems.length === 0 ? (
                <div className="text-center py-12 text-stone-500 bg-white rounded-2xl border border-stone-100">
                  <ShoppingBag size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-sm md:text-base">No items yet. Add the first shopping item.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {CATEGORY_ORDER.map((cat) => {
                    const categoryItems = shoppingItems.filter((item) => (item.category || 'uncategorized') === cat);
                    if (categoryItems.length === 0) return null;

                    return (
                      <div key={cat}>
                        <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">
                          {CATEGORY_LABELS[cat]} <span className="text-stone-400">({categoryItems.length})</span>
                        </h3>
                        <div className="space-y-3">
                          {categoryItems.map((item) => (
                            <ShoppingItemCard
                              key={item.id}
                              item={item}
                              isEditing={editingItemId === item.id}
                              editName={editItemName}
                              editDescription={editItemDescription}
                              editLink={editItemLink}
                              editPrice={editItemPrice}
                              editCategory={editItemCategory}
                              onEditNameChange={setEditItemName}
                              onEditDescriptionChange={setEditItemDescription}
                              onEditLinkChange={setEditItemLink}
                              onEditPriceChange={setEditItemPrice}
                              onEditCategoryChange={setEditItemCategory}
                              onStartEdit={() => startEditItem(item)}
                              onCancelEdit={() => setEditingItemId(null)}
                              onSave={() => handleUpdateShoppingItem(item.id)}
                              onDelete={() => handleDeleteShoppingItem(item.id)}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

        {/* LINKS TAB */}
        {activeTab === 'links' && (
          <>
            {/* Mobile: Add Link Modal */}
            {showAddLink && (
              <div className="md:hidden fixed inset-0 z-30 bg-black/50 flex items-end">
                <div className="bg-white w-full rounded-t-3xl p-5 pb-8 max-h-[85vh] overflow-y-auto animate-slide-up">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-serif text-lg text-stone-900">Add Shopping Link</h2>
                    <button
                      onClick={resetAddLinkForm}
                      className="p-2 -mr-2 text-stone-400 hover:text-stone-600 cursor-pointer"
                      aria-label="Close"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <form onSubmit={handleAddShoppingLink} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">URL</label>
                      <input
                        type="url"
                        value={newLinkUrl}
                        onChange={(e) => setNewLinkUrl(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-sage-500"
                        placeholder="https://..."
                        required
                      />
                      {isFetchingLinkPreview && (
                        <p className="text-xs text-stone-400 mt-1">Fetching preview...</p>
                      )}
                    </div>
                    {newLinkPreview?.image && (
                      <div className="rounded-xl overflow-hidden bg-stone-100">
                        <img src={newLinkPreview.image} alt="Preview" className="w-full h-40 object-cover" />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Title (optional)</label>
                      <input
                        type="text"
                        value={newLinkTitle}
                        onChange={(e) => setNewLinkTitle(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-sage-500"
                        placeholder="Product name..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Description (optional)</label>
                      <textarea
                        value={newLinkDescription}
                        onChange={(e) => setNewLinkDescription(e.target.value)}
                        rows={2}
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-sage-500 resize-none"
                        placeholder="Brief description..."
                      />
                    </div>
                    <Button type="submit" variant="primary" size="lg" className="w-full rounded-full" disabled={!newLinkUrl.trim() || isAddingLink}>
                      {isAddingLink ? 'Adding...' : 'Add Link'}
                    </Button>
                  </form>
                </div>
              </div>
            )}

            {/* Desktop: Add Link Form */}
            <section className="hidden md:block bg-white p-6 rounded-2xl border border-stone-100 shadow-sm mb-8">
              <h2 className="font-serif text-lg text-stone-900 mb-4 flex items-center gap-2">
                <Link2 size={20} className="text-sage-600" />
                Add Shopping Link
              </h2>
              <form onSubmit={handleAddShoppingLink} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">URL</label>
                  <input
                    type="url"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-sage-500"
                    placeholder="https://..."
                    required
                  />
                  {isFetchingLinkPreview && (
                    <p className="text-xs text-stone-400 mt-1">Fetching preview...</p>
                  )}
                </div>
                {newLinkPreview?.image && (
                  <div className="rounded-xl overflow-hidden bg-stone-100 max-w-sm">
                    <img src={newLinkPreview.image} alt="Preview" className="w-full h-40 object-cover" />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Title (optional)</label>
                    <input
                      type="text"
                      value={newLinkTitle}
                      onChange={(e) => setNewLinkTitle(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-sage-500"
                      placeholder="Product name..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Description (optional)</label>
                    <input
                      type="text"
                      value={newLinkDescription}
                      onChange={(e) => setNewLinkDescription(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-sage-500"
                      placeholder="Brief description..."
                    />
                  </div>
                </div>
                <Button type="submit" variant="primary" size="lg" className="rounded-full" disabled={!newLinkUrl.trim() || isAddingLink}>
                  {isAddingLink ? 'Adding...' : 'Add Link'}
                </Button>
              </form>
            </section>

            {/* Links List */}
            <section>
              <h2 className="font-serif text-base md:text-lg text-stone-900 mb-3 md:mb-4">
                Shopping Links {shoppingLinks.length > 0 && <span className="text-stone-400">({shoppingLinks.length})</span>}
              </h2>

              {isLoadingLinks ? (
                <div className="text-center py-12 text-stone-500">Loading…</div>
              ) : shoppingLinks.length === 0 ? (
                <div className="text-center py-12 text-stone-500 bg-white rounded-2xl border border-stone-100">
                  <Link2 size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-sm md:text-base">No links yet. Add product links for your client.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {shoppingLinks.map((link) => {
                    const displayTitle = link.title || link.linkPreview?.title || 'Untitled';
                    const displaySiteName = link.linkPreview?.siteName || (() => {
                      try { return new URL(link.url).hostname.replace('www.', ''); } catch { return 'Link'; }
                    })();

                    return (
                      <div 
                        key={link.id} 
                        className={`bg-white rounded-xl border border-stone-100 shadow-sm p-3 md:p-4 transition-opacity ${
                          link.checked ? 'opacity-60' : ''
                        }`}
                      >
                        {editingLinkId === link.id ? (
                          <div className="space-y-3">
                            <input
                              type="url"
                              value={editLinkUrl}
                              onChange={(e) => setEditLinkUrl(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500"
                              placeholder="URL"
                            />
                            <input
                              type="text"
                              value={editLinkTitle}
                              onChange={(e) => setEditLinkTitle(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500"
                              placeholder="Title"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateShoppingLink(link.id)}
                                className="flex items-center gap-1 px-3 py-2 rounded-full bg-sage-500 text-white text-sm font-medium hover:bg-sage-600 cursor-pointer"
                              >
                                <Save size={14} />
                                Save
                              </button>
                              <button
                                onClick={() => setEditingLinkId(null)}
                                className="flex items-center gap-1 px-3 py-2 rounded-full bg-stone-100 text-stone-600 text-sm font-medium hover:bg-stone-200 cursor-pointer"
                              >
                                <X size={14} />
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            {/* Checkbox */}
                            <button
                              onClick={() => handleToggleLinkChecked(link.id, !link.checked)}
                              className="flex-shrink-0 cursor-pointer"
                              aria-label={link.checked ? 'Mark as not purchased' : 'Mark as purchased'}
                            >
                              {link.checked ? (
                                <CheckSquare size={22} className="text-sage-500" />
                              ) : (
                                <Square size={22} className="text-stone-300 hover:text-stone-400" />
                              )}
                            </button>
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`font-medium hover:text-sage-600 transition-colors ${
                                  link.checked ? 'text-stone-500 line-through' : 'text-stone-900'
                                }`}
                              >
                                {displayTitle}
                              </a>
                              <p className="text-xs text-stone-400 mt-0.5 flex items-center gap-1">
                                <ExternalLink size={10} />
                                {displaySiteName}
                              </p>
                            </div>
                            {/* Actions */}
                            <div className="flex gap-1 flex-shrink-0">
                              <button
                                onClick={() => startEditLink(link)}
                                className="p-2 rounded-full text-stone-400 hover:text-sage-600 hover:bg-sage-50 cursor-pointer"
                                title="Edit"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteShoppingLink(link.id)}
                                className="p-2 rounded-full text-stone-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
};

// Upload Form Component
interface UploadFormProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  uploadFile: File | null;
  uploadPreview: string | null;
  uploadCaption: string;
  uploadSeason: Season | '';
  isUploading: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCaptionChange: (value: string) => void;
  onSeasonChange: (value: Season | '') => void;
  onSubmit: (e: React.FormEvent) => void;
  onClearFile: () => void;
}

const UploadForm: React.FC<UploadFormProps> = ({
  fileInputRef,
  uploadFile,
  uploadPreview,
  uploadCaption,
  uploadSeason,
  isUploading,
  onFileChange,
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
          Photo
        </label>
        <input
          ref={fileInputRef}
          id="upload-file"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          onChange={onFileChange}
          className="hidden"
        />

        {uploadPreview ? (
          <div className="relative inline-block">
            <img src={uploadPreview} alt="Preview" className="h-40 md:h-32 w-auto rounded-xl object-cover" />
            <button
              type="button"
              onClick={onClearFile}
              className="absolute -top-2 -right-2 h-7 w-7 flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 cursor-pointer shadow-md"
              aria-label="Remove photo"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-3 md:py-2 rounded-xl border-2 border-dashed border-stone-200 text-stone-500 hover:border-sage-400 hover:text-sage-600 transition-colors cursor-pointer"
          >
            <ImageIcon size={20} />
            <span>Choose photo</span>
          </button>
        )}
      </div>

      {/* Caption */}
      <div>
        <label htmlFor="upload-caption" className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">
          Caption <span className="font-normal text-stone-400">(optional)</span>
        </label>
        <textarea
          id="upload-caption"
          value={uploadCaption}
          onChange={(e) => onCaptionChange(e.target.value)}
          rows={2}
          className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent resize-none text-base"
          placeholder="Describe this outfit…"
        />
      </div>

      {/* Season */}
      <div>
        <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">
          Season <span className="font-normal text-stone-400">(optional)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {SEASON_ORDER.map((season) => (
            <button
              key={season}
              type="button"
              onClick={() => onSeasonChange(uploadSeason === season ? '' : season)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                uploadSeason === season
                  ? 'bg-sage-500 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {SEASON_LABELS[season]}
            </button>
          ))}
        </div>
      </div>
    </div>

    <Button type="submit" variant="primary" size="lg" className="mt-4 w-full md:w-auto rounded-full" disabled={!uploadFile || isUploading}>
      {isUploading ? 'Uploading…' : 'Add to Lookbook'}
    </Button>
  </form>
);

// Entry Card Component
interface EntryCardProps {
  entry: EditorialEntry;
  slug: string;
  passcode: string;
  isEditing: boolean;
  editCaption: string;
  editSeason: Season | '';
  onEditCaptionChange: (value: string) => void;
  onEditSeasonChange: (value: Season | '') => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  onReplacePhoto: (entryId: string, file: File) => Promise<void>;
}

const EntryCard: React.FC<EntryCardProps> = ({
  entry,
  slug,
  passcode,
  isEditing,
  editCaption,
  editSeason,
  onEditCaptionChange,
  onEditSeasonChange,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onReplacePhoto,
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [isReplacing, setIsReplacing] = useState(false);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchImage = async () => {
      setImageLoading(true);
      try {
        const res = await fetch(`/.netlify/functions/cms-image?key=${encodeURIComponent(entry.imageKey)}&slug=${slug}`, {
          headers: { 'X-Admin-Passcode': passcode },
        });
        if (res.ok) {
          const blob = await res.blob();
          if (imageUrl) URL.revokeObjectURL(imageUrl);
          setImageUrl(URL.createObjectURL(blob));
        }
      } catch {
        console.error('Failed to load image');
      } finally {
        setImageLoading(false);
      }
    };
    fetchImage();

    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [entry.imageKey, passcode, slug]);

  const handleReplaceClick = () => {
    replaceInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsReplacing(true);
    try {
      await onReplacePhoto(entry.id, file);
    } finally {
      setIsReplacing(false);
      if (replaceInputRef.current) {
        replaceInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="bg-white p-3 md:p-4 rounded-2xl border border-stone-100 shadow-sm">
      {/* Hidden file input for replacing photo */}
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
        {/* Thumbnail with replace overlay */}
        <div className="relative w-full sm:w-20 md:w-24 h-32 sm:h-20 md:h-24 flex-shrink-0 rounded-xl overflow-hidden bg-stone-100 group">
          {imageLoading || isReplacing ? (
            <div className="w-full h-full flex items-center justify-center text-stone-400">
              {isReplacing ? (
                <div className="h-6 w-6 border-2 border-sage-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <ImageIcon size={24} />
              )}
            </div>
          ) : imageUrl ? (
            <>
              <img src={imageUrl} alt={entry.caption || 'Outfit'} className="w-full h-full object-cover" />
              {/* Replace overlay on hover */}
              <button
                onClick={handleReplaceClick}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                aria-label="Replace photo"
              >
                <Camera size={24} className="text-white" />
              </button>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-400">
              <ImageIcon size={24} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div>
              <textarea
                value={editCaption}
                onChange={(e) => onEditCaptionChange(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 text-base focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent resize-none"
                autoFocus
              />
              {/* Season selector */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {SEASON_ORDER.map((season) => (
                  <button
                    key={season}
                    type="button"
                    onClick={() => onEditSeasonChange(editSeason === season ? '' : season)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      editSeason === season
                        ? 'bg-sage-500 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {SEASON_LABELS[season]}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={onSave}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-sage-500 text-white text-sm font-medium hover:bg-sage-600 transition-colors cursor-pointer"
                >
                  <Save size={16} />
                  Save
                </button>
                <button
                  onClick={onCancelEdit}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-stone-100 text-stone-600 text-sm font-medium hover:bg-stone-200 transition-colors cursor-pointer"
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-stone-700 text-sm md:text-base line-clamp-2">
                  {entry.caption || <span className="italic text-stone-400">No caption</span>}
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
                <button
                  onClick={handleReplaceClick}
                  disabled={isReplacing}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 sm:p-2 rounded-xl sm:rounded-lg bg-stone-50 sm:bg-transparent text-stone-500 hover:text-sage-600 hover:bg-sage-50 transition-colors cursor-pointer disabled:opacity-50"
                  aria-label="Replace photo"
                >
                  <Camera size={18} />
                  <span className="text-sm sm:hidden">Photo</span>
                </button>
                <button
                  onClick={onStartEdit}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 sm:p-2 rounded-xl sm:rounded-lg bg-stone-50 sm:bg-transparent text-stone-500 hover:text-sage-600 hover:bg-sage-50 transition-colors cursor-pointer"
                  aria-label="Edit caption"
                >
                  <Edit3 size={18} />
                  <span className="text-sm sm:hidden">Edit</span>
                </button>
                <button
                  onClick={onDelete}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 sm:p-2 rounded-xl sm:rounded-lg bg-stone-50 sm:bg-transparent text-stone-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  aria-label="Delete entry"
                >
                  <Trash2 size={18} />
                  <span className="text-sm sm:hidden">Delete</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Shopping Item Form Component
interface ShoppingItemFormProps {
  name: string;
  description: string;
  link: string;
  price: string;
  category: ShoppingCategory;
  linkPreview: LinkPreview | null;
  isFetchingPreview: boolean;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onLinkChange: (value: string) => void;
  onPriceChange: (value: string) => void;
  onCategoryChange: (value: ShoppingCategory) => void;
  onFetchPreview: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  submitLabel: string;
}

const ShoppingItemForm: React.FC<ShoppingItemFormProps> = ({
  name,
  description,
  link,
  price,
  category,
  linkPreview,
  isFetchingPreview,
  onNameChange,
  onDescriptionChange,
  onLinkChange,
  onPriceChange,
  onCategoryChange,
  onFetchPreview,
  onSubmit,
  isSubmitting,
  submitLabel,
}) => {
  const [showOptional, setShowOptional] = React.useState(false);

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
              <button
                key={cat}
                type="button"
                onClick={() => onCategoryChange(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  category === cat
                    ? 'bg-sage-500 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
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

        {/* Toggle for optional fields */}
        {!showOptional && !link && !price && !description && (
          <button
            type="button"
            onClick={() => setShowOptional(true)}
            className="text-sage-600 text-sm hover:text-sage-700 cursor-pointer"
          >
            + Add link, price, or notes
          </button>
        )}

        {/* Optional fields */}
        {(showOptional || link || price || description) && (
          <>
            {/* Link with preview fetch */}
            <div>
              <label htmlFor="item-link" className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">
                Product Link <span className="font-normal text-stone-400">(optional)</span>
              </label>
              <div className="flex gap-2">
                <input
                  id="item-link"
                  type="url"
                  value={link}
                  onChange={(e) => onLinkChange(e.target.value)}
                  className="flex-1 h-11 px-4 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent text-base"
                  placeholder="https://..."
                />
                <button
                  type="button"
                  onClick={onFetchPreview}
                  disabled={!link || !link.startsWith('http') || isFetchingPreview}
                  className="px-4 h-11 rounded-xl bg-stone-100 text-stone-600 text-sm font-medium hover:bg-stone-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
                >
                  {isFetchingPreview ? 'Loading…' : 'Fetch Preview'}
                </button>
              </div>
            </div>

            {/* Link Preview Display */}
            {linkPreview && (
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                <div className="flex gap-4">
                  {linkPreview.image && (
                    <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-stone-200">
                      <img
                        src={linkPreview.image}
                        alt={linkPreview.title || 'Preview'}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-900 line-clamp-2">{linkPreview.title || 'No title'}</p>
                    {linkPreview.description && (
                      <p className="text-stone-500 text-sm mt-1 line-clamp-2">{linkPreview.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-stone-400">
                      {linkPreview.favicon && (
                        <img
                          src={linkPreview.favicon}
                          alt=""
                          className="w-4 h-4"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                      <span>{linkPreview.siteName || new URL(linkPreview.url).hostname}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Price */}
              <div>
                <label htmlFor="item-price" className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">
                  Price <span className="font-normal text-stone-400">(optional)</span>
                </label>
                <input
                  id="item-price"
                  type="text"
                  value={price}
                  onChange={(e) => onPriceChange(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent text-base"
                  placeholder="$99"
                />
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="item-description" className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">
                  Notes <span className="font-normal text-stone-400">(optional)</span>
                </label>
                <input
                  id="item-description"
                  type="text"
                  value={description}
                  onChange={(e) => onDescriptionChange(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent text-base"
                  placeholder="Size, color, notes…"
                />
              </div>
            </div>
          </>
        )}
      </div>

      <Button type="submit" variant="primary" size="lg" className="mt-4 w-full md:w-auto rounded-full" disabled={!name.trim() || isSubmitting}>
        {isSubmitting ? 'Adding…' : submitLabel}
      </Button>
    </form>
  );
};

// Shopping Item Card Component
interface ShoppingItemCardProps {
  item: ShoppingItem;
  isEditing: boolean;
  editName: string;
  editDescription: string;
  editLink: string;
  editPrice: string;
  editCategory: ShoppingCategory;
  onEditNameChange: (value: string) => void;
  onEditDescriptionChange: (value: string) => void;
  onEditLinkChange: (value: string) => void;
  onEditPriceChange: (value: string) => void;
  onEditCategoryChange: (value: ShoppingCategory) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
}

const ShoppingItemCard: React.FC<ShoppingItemCardProps> = ({
  item,
  isEditing,
  editName,
  editDescription,
  editLink,
  editPrice,
  editCategory,
  onEditNameChange,
  onEditDescriptionChange,
  onEditLinkChange,
  onEditPriceChange,
  onEditCategoryChange,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
}) => {
  return (
    <div className="bg-white p-3 md:p-4 rounded-2xl border border-stone-100 shadow-sm">
      {isEditing ? (
        <div className="space-y-3">
          {/* Category pills for editing */}
          <div className="flex flex-wrap gap-2">
            {CATEGORY_ORDER.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => onEditCategoryChange(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  editCategory === cat
                    ? 'bg-sage-500 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={editName}
            onChange={(e) => onEditNameChange(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-stone-200 bg-white text-stone-900 text-base focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent"
            placeholder="Item name"
            autoFocus
          />
          <textarea
            value={editDescription}
            onChange={(e) => onEditDescriptionChange(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-900 text-base focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent resize-none"
            placeholder="Description"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="url"
              value={editLink}
              onChange={(e) => onEditLinkChange(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-stone-200 bg-white text-stone-900 text-base focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent"
              placeholder="Link URL"
            />
            <input
              type="text"
              value={editPrice}
              onChange={(e) => onEditPriceChange(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-stone-200 bg-white text-stone-900 text-base focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent"
              placeholder="Price"
            />
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={onSave}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-sage-500 text-white text-sm font-medium hover:bg-sage-600 transition-colors cursor-pointer"
            >
              <Save size={16} />
              Save
            </button>
            <button
              onClick={onCancelEdit}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-stone-100 text-stone-600 text-sm font-medium hover:bg-stone-200 transition-colors cursor-pointer"
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        </div>
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
              {item.price && (
                <span className="flex items-center gap-0.5 text-sm text-sage-600 font-medium bg-sage-50 px-2 py-0.5 rounded-full">
                  <DollarSign size={12} />
                  {item.price.replace('$', '')}
                </span>
              )}
            </div>
            {item.description && (
              <p className="text-stone-500 text-sm mt-1 line-clamp-2">{item.description}</p>
            )}
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
          </div>

          {/* Actions */}
          <div className="flex sm:flex-col gap-2">
            <button
              onClick={onStartEdit}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 sm:p-2 rounded-xl sm:rounded-lg bg-stone-50 sm:bg-transparent text-stone-500 hover:text-sage-600 hover:bg-sage-50 transition-colors cursor-pointer"
              aria-label="Edit item"
            >
              <Edit3 size={18} />
              <span className="text-sm sm:hidden">Edit</span>
            </button>
            <button
              onClick={onDelete}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 sm:p-2 rounded-xl sm:rounded-lg bg-stone-50 sm:bg-transparent text-stone-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              aria-label="Delete item"
            >
              <Trash2 size={18} />
              <span className="text-sm sm:hidden">Delete</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
