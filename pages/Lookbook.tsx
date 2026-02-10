import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Lock, Image as ImageIcon, X, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ShoppingBag, ExternalLink, Check, Square, CheckSquare, SlidersHorizontal, Lightbulb, Share, Plus, MoreVertical, Smartphone } from 'lucide-react';
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

// Device detection for Add to Home Screen instructions
type DeviceType = 'ios' | 'android' | 'desktop';

function detectDevice(): DeviceType {
  if (typeof window === 'undefined') return 'desktop';
  
  const ua = navigator.userAgent.toLowerCase();
  
  // Check for iOS (iPhone, iPad, iPod)
  if (/iphone|ipad|ipod/.test(ua)) {
    return 'ios';
  }
  
  // Check for Android
  if (/android/.test(ua)) {
    return 'android';
  }
  
  return 'desktop';
}

// Add to Home Screen CTA Component
const AddToHomeScreenCTA: React.FC = () => {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setDeviceType(detectDevice());
  }, []);

  const getInstructions = () => {
    switch (deviceType) {
      case 'ios':
        return {
          icon: <Share size={18} className="text-sage-600" />,
          title: 'Add to your iPhone',
          steps: [
            { icon: <Share size={16} />, text: 'Tap the Share button in Safari' },
            { icon: <Plus size={16} />, text: 'Scroll down and tap "Add to Home Screen"' },
            { icon: <Check size={16} />, text: 'Tap "Add" to confirm' },
          ],
        };
      case 'android':
        return {
          icon: <MoreVertical size={18} className="text-sage-600" />,
          title: 'Add to your Android',
          steps: [
            { icon: <MoreVertical size={16} />, text: 'Tap the menu (⋮) in Chrome' },
            { icon: <Smartphone size={16} />, text: 'Tap "Add to Home screen"' },
            { icon: <Check size={16} />, text: 'Tap "Add" to confirm' },
          ],
        };
      default:
        return {
          icon: <Smartphone size={18} className="text-sage-600" />,
          title: 'Add as an app',
          steps: [
            { icon: <Plus size={16} />, text: 'Look for the install icon (⊕) in your browser\'s address bar' },
            { icon: <MoreVertical size={16} />, text: 'Chrome/Edge: Click ⋮ menu → "Install Style Forage..."' },
            { icon: <Check size={16} />, text: 'Click "Install" to add the app to your desktop' },
          ],
        };
    }
  };

  const instructions = getInstructions();

  return (
    <div className="mt-6 bg-sage-50 rounded-2xl border border-sage-100 overflow-hidden">
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        variant="ghost"
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-sage-100/50 h-auto"
      >
        <div className="flex items-center gap-3">
          {instructions.icon}
          <span className="text-sm font-medium text-stone-700">{instructions.title}</span>
        </div>
        <ChevronDown
          size={18}
          className={`text-stone-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </Button>
      
      {isExpanded && (
        <div className="px-4 pb-4 pt-1">
          <p className="text-xs text-stone-500 mb-3">
            Save this lookbook to your home screen for quick access:
          </p>
          <ol className="space-y-2">
            {instructions.steps.map((step, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-stone-600">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-sage-100 flex items-center justify-center text-sage-600">
                  {index + 1}
                </span>
                <span className="flex items-center gap-1.5">
                  {step.icon}
                  {step.text}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

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

interface RelatedLookbook {
  slug: string;
  clientName: string;
  season?: Season;
}

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

interface Tip {
  id: string;
  text: string;
  order: number;
  createdAt: string;
}

const PASSCODE_KEY_PREFIX = 'view_passcode_';

const ACTION_SHEET_CLOSE_MS = 300;
const SWIPE_CLOSE_THRESHOLD_PX = 80;

/** Action sheet (bottom sheet) with slide-up/slide-down animation and swipe-down to close on mobile. */
interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  bodyClassName?: string;
}

const ActionSheet: React.FC<ActionSheetProps> = ({ isOpen, onClose, title, children, bodyClassName = '' }) => {
  const [isExiting, setIsExiting] = useState(false);
  const touchStartY = useRef<number>(0);
  const bodyScrollTop = useRef<number>(0);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Reset exit state when opening so a re-opened sheet doesn't show exit animation
  useEffect(() => {
    if (isOpen) setIsExiting(false);
  }, [isOpen]);

  const startClose = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, ACTION_SHEET_CLOSE_MS);
  }, [isExiting, onClose]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    bodyScrollTop.current = bodyRef.current?.scrollTop ?? 0;
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const endY = e.changedTouches[0].clientY;
    const deltaY = endY - touchStartY.current;
    const wasAtTop = bodyScrollTop.current <= 2;
    if (deltaY > SWIPE_CLOSE_THRESHOLD_PX && wasAtTop) {
      startClose();
    }
  }, [startClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`md:hidden fixed inset-0 z-[65] bg-black/50 transition-opacity duration-300 ${isExiting ? 'opacity-0 pointer-events-none' : ''}`}
      onClick={(e) => { e.stopPropagation(); startClose(); }}
    >
      <div
        className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] overflow-hidden flex flex-col ${isExiting ? 'animate-slide-down' : 'animate-slide-up'}`}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="p-4 border-b border-stone-100 flex-shrink-0">
          <div className="w-12 h-1 bg-stone-300 rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg text-stone-900">{title}</h3>
            <Button
              type="button"
              onClick={startClose}
              variant="ghost"
              size="icon"
              className="-mr-2"
              aria-label="Close"
            >
              <X size={24} />
            </Button>
          </div>
        </div>
        <div
          ref={bodyRef}
          className={`flex-1 overflow-y-auto overflow-x-hidden p-4 min-h-0 ${bodyClassName}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export const Lookbook: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [clientName, setClientName] = useState<string | null>(null);
  const [lookbookTitle, setLookbookTitle] = useState<string | null>(null);
  const [lookbookDescription, setLookbookDescription] = useState<string | null>(null);
  const [currentSeason, setCurrentSeason] = useState<Season | undefined>();
  const [relatedLookbooks, setRelatedLookbooks] = useState<RelatedLookbook[]>([]);

  // Content state
  const [entries, setEntries] = useState<EditorialEntry[]>([]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [tips, setTips] = useState<Tip[]>([]);
  const [showTips, setShowTips] = useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);

  const passcodeKey = `${PASSCODE_KEY_PREFIX}${slug}`;

  // Point manifest at current lookbook so Add to Home Screen opens this lookbook URL
  // Uses blob URL approach for better iOS compatibility
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    const appleTitle = document.querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-title"]');
    if (!link) return;
    
    let blobUrl: string | null = null;
    
    if (slug) {
      const title = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const startUrl = `/lookbook/${slug}`;
      
      const manifest = {
        id: `styleforage-lookbook-${slug}`,
        name: `Lookbook - ${title}`,
        short_name: title,
        description: 'Your personalized style lookbook by Roz',
        start_url: startUrl,
        scope: startUrl,
        display: 'standalone',
        background_color: '#FAF9F7',
        theme_color: '#1c1917',
        orientation: 'portrait-primary',
        icons: [
          { src: '/images/favicon.png', sizes: '32x32', type: 'image/png' },
          { src: '/images/app-icon.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' }
        ]
      };
      
      const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
      blobUrl = URL.createObjectURL(blob);
      link.href = blobUrl;
      
      if (appleTitle) appleTitle.content = title;
      
      return () => {
        if (blobUrl) URL.revokeObjectURL(blobUrl);
        link.href = '/manifest.json';
        if (appleTitle) appleTitle.content = 'Style Forage';
      };
    } else {
      link.href = '/manifest.json';
      if (appleTitle) appleTitle.content = 'Style Forage';
    }
  }, [slug]);

  // Check for stored passcode on mount
  useEffect(() => {
    if (!slug) return;
    const stored = sessionStorage.getItem(passcodeKey);
    if (stored) {
      verifyPasscode(stored, true);
    }
  }, [slug]);

  // Fetch entries, shopping items, links and tips when authenticated
  useEffect(() => {
    if (isAuthenticated && slug) {
      fetchEntries();
      fetchShoppingItems();
      fetchTips();
    }
  }, [isAuthenticated, slug]);

  const verifyPasscode = async (code: string, silent = false) => {
    if (!slug) return;
    
    if (!silent) {
      setIsAuthenticating(true);
      setAuthError('');
    }

    try {
      const res = await fetch('/.netlify/functions/cms-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: code, type: 'view', slug }),
      });

      if (res.ok) {
        const data = await res.json();
        sessionStorage.setItem(passcodeKey, code);
        setPasscode(code);
        setIsAuthenticated(true);
        if (data.lookbook?.clientName) {
          setClientName(data.lookbook.clientName);
        }
        if (data.lookbook?.title) {
          setLookbookTitle(data.lookbook.title);
        }
        if (data.lookbook?.description) {
          setLookbookDescription(data.lookbook.description);
        }
        if (data.lookbook?.season) {
          setCurrentSeason(data.lookbook.season);
        }
        if (data.relatedLookbooks) {
          setRelatedLookbooks(data.relatedLookbooks);
        }
      } else if (!silent) {
        const data = await res.json();
        if (res.status === 404) {
          setAuthError('Lookbook not found');
        } else {
          setAuthError(data.error || 'Invalid code');
        }
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

  const fetchEntries = async () => {
    if (!slug) return;
    
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`/.netlify/functions/cms-list?slug=${slug}`, {
        headers: { 'X-View-Passcode': sessionStorage.getItem(passcodeKey) || '' },
      });

      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      } else {
        setError('Failed to load lookbook');
      }
    } catch {
      setError('Failed to load lookbook');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchShoppingItems = async () => {
    if (!slug) return;

    try {
      const res = await fetch(`/.netlify/functions/cms-shopping?slug=${slug}`, {
        headers: { 'X-View-Passcode': sessionStorage.getItem(passcodeKey) || '' },
      });

      if (res.ok) {
        const data = await res.json();
        setShoppingItems(data);
      }
    } catch {
      // Ignore - shopping list is optional
    }
  };

  const fetchTips = async () => {
    if (!slug) return;

    try {
      const res = await fetch(`/.netlify/functions/cms-tips?slug=${slug}`, {
        headers: { 'X-View-Passcode': sessionStorage.getItem(passcodeKey) || '' },
      });

      if (res.ok) {
        const data = await res.json();
        setTips(data);
      }
    } catch {
      // Ignore - tips are optional
    }
  };

  const handleToggleChecked = async (itemId: string, checked: boolean) => {
    // Optimistic update
    setShoppingItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, checked } : item
    ));

    try {
      await fetch('/.netlify/functions/cms-shopping', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-View-Passcode': sessionStorage.getItem(passcodeKey) || '',
        },
        body: JSON.stringify({ slug, id: itemId, checked }),
      });
    } catch {
      // Revert on error
      setShoppingItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, checked: !checked } : item
      ));
    }
  };

  // No slug provided
  if (!slug) {
    return (
      <div className="min-h-screen bg-sand-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="font-serif text-2xl text-stone-900 mb-4">Lookbook Not Found</h1>
          <p className="text-stone-500 mb-6">Please check the link you were given.</p>
          <Link to="/" className="text-sage-600 hover:text-sage-700">
            ← Back to Style Forage
          </Link>
        </div>
      </div>
    );
  }

  // Passcode screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-sand-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-sage-100 text-sage-700 mb-4">
              <Lock size={32} />
            </div>
            <h1 className="font-serif text-2xl md:text-3xl text-stone-900 mb-2">Style Lookbook</h1>
            <p className="text-stone-500 text-sm">Enter your 4-digit code to view your curated looks</p>
          </div>

          <form onSubmit={handleAuthSubmit} className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
            <div className="mb-4">
              <label htmlFor="passcode" className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">
                4-digit code
              </label>
              <input
                id="passcode"
                type="text"
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
              {isAuthenticating ? 'Verifying…' : 'View Lookbook'}
            </Button>
          </form>

          <AddToHomeScreenCTA />

          <div className="text-center mt-6">
            <Link to="/" className="text-sm text-stone-500 hover:text-sage-600 transition-colors">
              ← Back to Style Forage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-white/70">Loading your looks…</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={fetchEntries} variant="light" size="md">
            Try again
          </Button>
        </div>
      </div>
    );
  }

  // Empty state
  if (entries.length === 0) {
    return (
      <div className="min-h-screen bg-sand-50 flex items-center justify-center p-4">
        <div className="text-center">
          <ImageIcon size={64} className="mx-auto text-stone-300 mb-4" />
          <p className="text-stone-500 text-lg">Your lookbook is being curated…</p>
          <p className="text-stone-400 text-sm mt-2">Check back soon for your personalized style selections.</p>
          <Link to="/" className="inline-block mt-6 text-sage-600 hover:text-sage-700">
            ← Back to Style Forage
          </Link>
        </div>
      </div>
    );
  }

  // Story-style lookbook view with shopping list modal
  return (
    <>
      <StoryView
        entries={entries}
        slug={slug}
        passcode={sessionStorage.getItem(passcodeKey) || ''}
        clientName={clientName}
        lookbookTitle={lookbookTitle}
        lookbookDescription={lookbookDescription}
        currentSeason={currentSeason}
        relatedLookbooks={relatedLookbooks}
        shoppingItemsCount={shoppingItems.length}
        tipsCount={tips.length}
        captionExpanded={captionExpanded}
        setCaptionExpanded={setCaptionExpanded}
        onShowShoppingList={() => { setCaptionExpanded(false); setShowShoppingList(true); }}
        onShowTips={() => { setCaptionExpanded(false); setShowTips(true); }}
      />
      
      <ActionSheet
        isOpen={showShoppingList}
        onClose={() => setShowShoppingList(false)}
        title="Shopping List"
      >
        <ShoppingListContent
          items={shoppingItems}
          onToggleChecked={handleToggleChecked}
        />
      </ActionSheet>

      {/* Desktop: Shopping list as overlay */}
      {showShoppingList && (
        <div className="hidden md:block fixed inset-0 z-50">
          <ShoppingListView
            items={shoppingItems}
            clientName={clientName}
            onBack={() => setShowShoppingList(false)}
            onToggleChecked={handleToggleChecked}
          />
        </div>
      )}

      <ActionSheet
        isOpen={showTips}
        onClose={() => setShowTips(false)}
        title="Tips"
      >
        {tips.length === 0 ? (
          <p className="text-stone-500 text-sm text-center py-8">No tips yet.</p>
        ) : (
          <div className="space-y-3">
            {tips.map((tip, index) => (
              <div
                key={tip.id}
                className="bg-stone-50 rounded-xl border border-stone-100 p-4 flex items-start gap-3"
              >
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-sage-100 text-sage-700 text-sm font-semibold flex items-center justify-center">
                  {index + 1}
                </span>
                <p className="text-stone-700 text-sm md:text-base leading-relaxed flex-1">{normalizePastedText(tip.text)}</p>
              </div>
            ))}
          </div>
        )}
      </ActionSheet>

      {/* Desktop: Tips overlay */}
      {showTips && (
        <div className="hidden md:block fixed inset-0 z-50 bg-white">
          <div className="h-full flex flex-col max-w-2xl mx-auto">
            <div className="p-6 border-b border-stone-100 flex-shrink-0 flex items-center justify-between">
              <h2 className="font-serif text-xl text-stone-900">Tips</h2>
              <Button
                onClick={() => setShowTips(false)}
                variant="ghost"
                size="icon"
              >
                <X size={24} />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {tips.length === 0 ? (
                <p className="text-stone-500 text-sm text-center py-12">No tips yet.</p>
              ) : (
                <div className="space-y-3">
                  {tips.map((tip, index) => (
                    <div
                      key={tip.id}
                      className="bg-stone-50 rounded-xl border border-stone-100 p-4 flex items-start gap-3"
                    >
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-sage-100 text-sage-700 text-sm font-semibold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <p className="text-stone-700 text-sm md:text-base leading-relaxed flex-1">{normalizePastedText(tip.text)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Fullscreen image lightbox with swipe/arrow navigation
interface ImageLightboxProps {
  imageUrls: string[];
  initialIndex: number;
  onClose: () => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({ imageUrls, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const touchStartX = useRef<number | null>(null);
  const hasMultiple = imageUrls.length > 1;

  const goNext = useCallback(() => {
    if (hasMultiple) setCurrentIndex((i) => (i + 1) % imageUrls.length);
  }, [hasMultiple, imageUrls.length]);

  const goPrev = useCallback(() => {
    if (hasMultiple) setCurrentIndex((i) => (i - 1 + imageUrls.length) % imageUrls.length);
  }, [hasMultiple, imageUrls.length]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, goNext, goPrev]);

  // Swipe navigation
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) goNext();
    else if (diff < -50) goPrev();
    touchStartX.current = null;
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-black animate-lightbox-fade-in flex items-center justify-center"
      onClick={(e) => { e.stopPropagation(); onClose(); }}
      onTouchStart={(e) => { e.stopPropagation(); onTouchStart(e); }}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => { e.stopPropagation(); onTouchEnd(e); }}
    >
      {/* Close button */}
      <Button
        onClick={onClose}
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-10 bg-white/10 text-white hover:bg-white/20 safe-top"
        aria-label="Close lightbox"
      >
        <X size={24} />
      </Button>

      {/* Image counter */}
      {hasMultiple && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm font-medium safe-top">
          {currentIndex + 1} / {imageUrls.length}
        </div>
      )}

      {/* Prev/Next arrows (desktop only) */}
      {hasMultiple && (
        <>
          <Button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            variant="ghost"
            size="icon"
            className="hidden md:flex absolute left-4 z-10 p-3 bg-white/10 text-white hover:bg-white/20 h-auto w-auto"
            aria-label="Previous image"
          >
            <ChevronLeft size={24} />
          </Button>
          <Button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            variant="ghost"
            size="icon"
            className="hidden md:flex absolute right-4 z-10 p-3 bg-white/10 text-white hover:bg-white/20 h-auto w-auto"
            aria-label="Next image"
          >
            <ChevronRight size={24} />
          </Button>
        </>
      )}

      {/* Image */}
      <img
        src={imageUrls[currentIndex]}
        alt={`Image ${currentIndex + 1} of ${imageUrls.length}`}
        className="max-h-full max-w-full object-contain select-none"
        style={{ touchAction: 'pinch-zoom' }}
        onClick={(e) => e.stopPropagation()}
        draggable={false}
      />
    </div>
  );
};

// Instagram Story-style viewer
interface StoryViewProps {
  entries: EditorialEntry[];
  slug: string;
  passcode: string;
  clientName: string | null;
  lookbookTitle: string | null;
  lookbookDescription: string | null;
  currentSeason?: Season;
  relatedLookbooks: RelatedLookbook[];
  shoppingItemsCount: number;
  tipsCount: number;
  captionExpanded: boolean;
  setCaptionExpanded: (value: boolean) => void;
  onShowShoppingList: () => void;
  onShowTips: () => void;
}

const StoryView: React.FC<StoryViewProps> = ({ entries, slug, passcode, clientName, lookbookTitle, lookbookDescription, currentSeason, relatedLookbooks, shoppingItemsCount, tipsCount, captionExpanded, setCaptionExpanded, onShowShoppingList, onShowTips }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<Season | 'all'>('all');
  const [showSeasonMenu, setShowSeasonMenu] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close Read more panel when changing slides
  useEffect(() => {
    setCaptionExpanded(false);
  }, [currentIndex, setCaptionExpanded]);

  // Filter entries by selected season
  const filteredEntries = selectedSeason === 'all' 
    ? entries 
    : entries.filter(e => e.season === selectedSeason);

  // Check if any entries have seasons assigned
  const hasSeasonedEntries = entries.some(e => e.season);

  // Reset currentIndex when filter changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [selectedSeason]);

  // Minimum swipe distance
  const minSwipeDistance = 50;

  const goToNext = useCallback(() => {
    if (filteredEntries.length === 0 || isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(currentIndex === filteredEntries.length - 1 ? 0 : currentIndex + 1);
    setTimeout(() => setIsTransitioning(false), 300);
  }, [currentIndex, filteredEntries.length, isTransitioning]);

  const goToPrev = useCallback(() => {
    if (filteredEntries.length === 0 || isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(currentIndex === 0 ? filteredEntries.length - 1 : currentIndex - 1);
    setTimeout(() => setIsTransitioning(false), 300);
  }, [currentIndex, filteredEntries.length, isTransitioning]);

  // Touch handlers: horizontal swipe (left = next, right = prev) on mobile
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrev();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev]);

  // Tap navigation: left third = prev, right third = next (horizontal, matches swipe)
  const handleTap = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const thirdWidth = rect.width / 3;

    if (clickX < thirdWidth) {
      goToPrev();
    } else if (clickX > thirdWidth * 2) {
      goToNext();
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-stone-900 md:bg-stone-100 overflow-hidden select-none"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClick={handleTap}
    >
      {/* Progress indicators: same on mobile + desktop — track stone, current sage, past stone */}
      <div className="absolute top-0 left-0 right-0 z-20 p-3 safe-top">
        <div className="flex gap-1">
          {filteredEntries.map((_, index) => {
            const isPast = index < currentIndex;
            const isCurrent = index === currentIndex;
            const fillWidth = isPast || isCurrent ? 'w-full' : 'w-0';
            const fillColor = isCurrent ? 'bg-sage-500' : isPast ? 'bg-stone-300' : '';
            return (
              <div
                key={index}
                className="flex-1 h-0.5 rounded-full overflow-hidden bg-stone-300"
              >
                <div
                  className={`h-full transition-all duration-300 ${fillWidth} ${fillColor}`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop: Header */}
      <div className="hidden md:flex absolute top-0 left-0 right-0 z-20 items-center justify-between px-8 py-6 bg-gradient-to-b from-sage-400 to-transparent">
        <div className="flex flex-col">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-serif text-stone-900 text-2xl">
              {lookbookTitle || (clientName ? `${clientName}'s Lookbook` : 'Style Forage')}
            </span>
            <span className="text-stone-500 text-sm font-medium">
              {currentIndex + 1} of {filteredEntries.length}
            </span>
          </div>
          {lookbookDescription && (
            <p className="text-stone-500 text-sm mt-1 max-w-md">
              {lookbookDescription}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {/* Season switcher */}
          {relatedLookbooks.length > 1 && (
            <div className="flex gap-1 bg-white/80 backdrop-blur-sm rounded-full p-1" onClick={(e) => e.stopPropagation()}>
              {relatedLookbooks.filter(l => l.season).map((lookbook) => (
                <Link
                  key={lookbook.slug}
                  to={`/lookbook/${lookbook.slug}`}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    lookbook.slug === slug
                      ? 'bg-sage-500 text-white'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {lookbook.season ? SEASON_LABELS[lookbook.season] : 'View'}
                </Link>
              ))}
            </div>
          )}
          {shoppingItemsCount > 0 && (
            <Button
              onClick={(e) => { e.stopPropagation(); onShowShoppingList(); }}
              variant="outline"
              size="md"
              className="gap-2"
            >
              <ShoppingBag size={16} />
              Shopping List
              <span className="rounded-full bg-stone-300 px-2 py-0.5 text-xs font-medium text-stone-600">
                {shoppingItemsCount}
              </span>
            </Button>
          )}
          {tipsCount > 0 && (
            <Button
              onClick={(e) => { e.stopPropagation(); onShowTips(); }}
              variant="outline"
              size="md"
              className="gap-2"
            >
              <Lightbulb size={16} />
              Tips
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
                {tipsCount}
              </span>
            </Button>
          )}
          {/* Season filter for entries */}
          {hasSeasonedEntries && (
            <div className="flex gap-1 bg-white/80 backdrop-blur-sm rounded-full p-1" onClick={(e) => e.stopPropagation()}>
              <Button
                onClick={() => setSelectedSeason('all')}
                variant={selectedSeason === 'all' ? 'chip-selected' : 'chip'}
                size="sm"
                className="px-3 py-1.5 text-xs h-auto"
              >
                All
              </Button>
              {SEASON_ORDER.map((season) => (
                <Button
                  key={season}
                  onClick={() => setSelectedSeason(season)}
                  variant={selectedSeason === season ? 'chip-selected' : 'chip'}
                  size="sm"
                  className="px-3 py-1.5 text-xs h-auto"
                >
                  {SEASON_LABELS[season]}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile: Top buttons - z-[60] so they stay above Read more ActionSheet (z-50) */}
      <div className="md:hidden absolute top-12 right-4 z-[60] flex flex-col items-end gap-2">
        {shoppingItemsCount > 0 && (
          <Button
            onClick={(e) => { e.stopPropagation(); onShowShoppingList(); }}
            variant="ghost"
            size="icon"
            className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
            aria-label="View shopping list"
          >
            <ShoppingBag size={24} />
          </Button>
        )}
        {tipsCount > 0 && (
          <Button
            onClick={(e) => { e.stopPropagation(); onShowTips(); }}
            variant="ghost"
            size="icon"
            className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
            aria-label="View tips"
          >
            <Lightbulb size={24} />
          </Button>
        )}
        {/* Season filter button */}
        {hasSeasonedEntries && (
          <Button
            onClick={(e) => { e.stopPropagation(); setShowSeasonMenu(true); }}
            variant={selectedSeason !== 'all' ? 'primary' : 'ghost'}
            size="icon"
            className={selectedSeason !== 'all' ? '' : 'bg-white/20 text-white hover:bg-white/30'}
            aria-label="Filter by season"
          >
            <SlidersHorizontal size={24} />
          </Button>
        )}
      </div>

      {/* Desktop: Side navigation arrows */}
      <div className="hidden md:flex absolute inset-y-0 left-0 z-20 items-center px-4">
        <Button
          onClick={(e) => { e.stopPropagation(); goToPrev(); }}
          disabled={currentIndex === 0}
          variant="light"
          size="icon"
          className={`p-3 shadow-lg h-auto w-auto ${
            currentIndex === 0
              ? 'opacity-30'
              : 'opacity-80 hover:opacity-100 hover:scale-105'
          }`}
          aria-label="Previous"
        >
          <ChevronUp size={24} className="text-stone-700 -rotate-90" />
        </Button>
      </div>
      <div className="hidden md:flex absolute inset-y-0 right-0 z-20 items-center px-4">
        <Button
          onClick={(e) => { e.stopPropagation(); goToNext(); }}
          disabled={currentIndex === filteredEntries.length - 1}
          variant="light"
          size="icon"
          className={`p-3 shadow-lg h-auto w-auto ${
            currentIndex === filteredEntries.length - 1
              ? 'opacity-30'
              : 'opacity-80 hover:opacity-100 hover:scale-105'
          }`}
          aria-label="Next"
        >
          <ChevronDown size={24} className="-rotate-90 text-stone-700" />
        </Button>
      </div>

      {/* Story slides */}
      <div className="relative w-full h-full md:flex md:items-center md:justify-center md:py-20 md:px-24">
        {filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8">
            <p className="text-stone-500 text-lg mb-2">No outfits for this season</p>
            <Button
              onClick={() => setSelectedSeason('all')}
              variant="ghost"
              size="md"
              className="text-sage-600 hover:text-sage-700"
            >
              View all outfits
            </Button>
          </div>
        ) : (
          filteredEntries.map((entry, index) => (
            <StorySlide
              key={entry.id}
              entry={entry}
              slug={slug}
              passcode={passcode}
              isActive={index === currentIndex}
              isPrev={index < currentIndex}
              captionExpanded={captionExpanded}
              setCaptionExpanded={setCaptionExpanded}
            />
          ))
        )}
      </div>

      {/* Mobile: Branding with title and description */}
      <div className="md:hidden absolute top-4 left-4 right-4 z-10 pointer-events-none">
        <span className="font-serif text-white/90 text-sm drop-shadow-md block">
          {lookbookTitle || (clientName ? `${clientName}'s Lookbook` : 'Style Forage')}
        </span>
        {lookbookDescription && (
          <span className="block text-white/70 text-xs mt-0.5 drop-shadow-md line-clamp-2">
            {lookbookDescription}
          </span>
        )}
      </div>


      {/* Mobile: Related lookbooks switcher */}
      {relatedLookbooks.length > 1 && !hasSeasonedEntries && (
        <div
          className="md:hidden absolute bottom-16 left-1/2 -translate-x-1/2 z-20 flex gap-1 bg-black/30 backdrop-blur-sm rounded-full p-1"
          onClick={(e) => e.stopPropagation()}
        >
          {relatedLookbooks.filter(l => l.season).map((lookbook) => (
            <Link
              key={lookbook.slug}
              to={`/lookbook/${lookbook.slug}`}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                lookbook.slug === slug
                  ? 'bg-white text-stone-900'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              {lookbook.season ? SEASON_LABELS[lookbook.season] : 'View'}
            </Link>
          ))}
        </div>
      )}

      {/* Mobile: Season filter bottom sheet modal */}
      <ActionSheet
        isOpen={showSeasonMenu}
        onClose={() => setShowSeasonMenu(false)}
        title="Filter by Season"
      >
        <div className="space-y-2">
          <Button
            onClick={() => { setSelectedSeason('all'); setShowSeasonMenu(false); }}
            variant={selectedSeason === 'all' ? 'chip-selected' : 'chip'}
            size="lg"
            fullWidth
            className="justify-start px-4 py-3"
          >
            All Seasons
          </Button>
          {SEASON_ORDER.map((season) => (
            <Button
              key={season}
              onClick={() => { setSelectedSeason(season); setShowSeasonMenu(false); }}
              variant={selectedSeason === season ? 'chip-selected' : 'chip'}
              size="lg"
              fullWidth
              className="justify-start px-4 py-3"
            >
              {SEASON_LABELS[season]}
            </Button>
          ))}
        </div>
      </ActionSheet>
    </div>
  );
};

// Individual story slide
interface StorySlideProps {
  entry: EditorialEntry;
  slug: string;
  passcode: string;
  isActive: boolean;
  isPrev: boolean;
  captionExpanded: boolean;
  setCaptionExpanded: (value: boolean) => void;
}

const StorySlide: React.FC<StorySlideProps> = ({ entry, slug, passcode, isActive, isPrev, captionExpanded, setCaptionExpanded }) => {
  const imageKeys = (entry.imageKeys && entry.imageKeys.length > 0) ? entry.imageKeys : [entry.imageKey];
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const urlsRef = useRef<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    const headers = { 'X-View-Passcode': passcode };
    let cancelled = false;
    urlsRef.current = [];

    const fetchAll = async () => {
      try {
        const results = await Promise.all(
          imageKeys.map(async (key) => {
            const res = await fetch(
              `/.netlify/functions/cms-image?key=${encodeURIComponent(key)}&slug=${slug}`,
              { headers }
            );
            if (res.ok) {
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              if (!cancelled) urlsRef.current.push(url);
              else URL.revokeObjectURL(url);
              return url;
            }
            return null;
          })
        );
        if (cancelled) {
          results.forEach((u) => u && URL.revokeObjectURL(u));
          return;
        }
        const valid = results.filter((u): u is string => u != null);
        setImageUrls(valid);
        if (valid.length === 0) setImageError(true);
      } catch {
        if (!cancelled) setImageError(true);
      } finally {
        if (!cancelled) setImageLoading(false);
      }
    };
    fetchAll();

    return () => {
      cancelled = true;
      urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      urlsRef.current = [];
    };
  }, [slug, passcode, imageKeys.join(',')]);

  return (
    <>
      {/* Mobile Layout - horizontal slide (swipe left/right to cycle) */}
      <div
        className={`md:hidden absolute inset-0 transition-all duration-300 ease-out flex flex-col min-h-0 ${
          isActive
            ? 'opacity-100 scale-100 translate-x-0'
            : isPrev
            ? 'opacity-0 scale-95 -translate-x-full'
            : 'opacity-0 scale-95 translate-x-full'
        }`}
      >
        {/* Scrollable gallery - stacks vertically for multiple images */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-stone-900">
          <div className={`relative w-full ${imageUrls.length === 1 ? 'h-[60vh] min-h-[60vh] flex items-center justify-center' : ''}`}>
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-stone-800 min-h-[50vh]">
                <div className="h-8 w-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {imageError && !imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-stone-800 text-stone-500 min-h-[50vh]">
                <ImageIcon size={48} />
              </div>
            )}
            {imageUrls.length > 0 && !imageLoading && (
              <div className={`lookbook-gallery-grid w-full p-1 ${imageUrls.length === 1 ? 'single-image h-full min-h-0' : 'mobile-stacked'}`}>
                {imageUrls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={entry.caption ? `${entry.caption} ${i + 1}` : 'Curated outfit'}
                    className="bg-stone-900"
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Caption: always anchored to bottom of screen with gradient */}
        <div
          className="absolute inset-x-0 bottom-0 z-10 flex flex-col justify-end pt-12 pb-6 safe-bottom min-h-[100px] pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 45%, transparent 100%)' }}
        >
          {(entry.title || entry.caption) ? (
            <div className="pointer-events-auto px-4 flex flex-col items-stretch text-left" onClick={(e) => e.stopPropagation()}>
              {entry.title ? (
                <p className="font-serif text-lg text-white drop-shadow-lg">{normalizePastedText(entry.title)}</p>
              ) : null}
              <div className="font-sans text-sm text-white/95 leading-relaxed drop-shadow-lg max-h-16 overflow-hidden whitespace-pre-wrap">
                {entry.caption ? <p>{normalizePastedText(entry.caption)}</p> : null}
              </div>
              <Button
                type="button"
                onClick={() => setCaptionExpanded(true)}
                variant="ghost"
                size="sm"
                className="mt-2 self-end text-xs font-medium text-white/90 hover:text-white underline underline-offset-2 h-auto p-0"
              >
                Read more
              </Button>
            </div>
          ) : null}
        </div>

        {(entry.title || entry.caption) && (
          <ActionSheet
            isOpen={captionExpanded}
            onClose={() => setCaptionExpanded(false)}
            title={entry.title || 'Caption'}
            bodyClassName="caption-modal-body"
          >
            {entry.title ? (
              <p className="font-serif text-xl text-stone-900 mb-3">{normalizePastedText(entry.title)}</p>
            ) : null}
            {entry.caption ? (
              <p className="font-sans text-sm text-stone-700 leading-relaxed break-words whitespace-pre-wrap">{normalizePastedText(entry.caption)}</p>
            ) : null}
          </ActionSheet>
        )}
      </div>

      {/* Desktop Editorial Layout - gallery 40vw, caption vertical scroll only */}
      <div
        className={`hidden md:flex absolute inset-0 items-center justify-center transition-all duration-500 ease-out ${
          isActive
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16 max-w-6xl mx-auto px-4 w-full">
          <div className="relative flex-shrink-0 w-[40vw] max-w-[480px] h-[70vh] max-h-[85vh] rounded-lg overflow-hidden shadow-2xl bg-stone-200">
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-stone-200 rounded-lg">
                <div className="h-8 w-8 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {imageError && !imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-stone-200 rounded-lg text-stone-400">
                <ImageIcon size={48} />
              </div>
            )}
            {imageUrls.length > 0 && !imageLoading && (
              <div className={`lookbook-gallery-grid w-full h-full overflow-auto p-2 ${imageUrls.length === 1 ? 'single-image' : ''}`}>
                {imageUrls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={entry.caption ? `${entry.caption} ${i + 1}` : 'Curated outfit'}
                    className="bg-stone-900 cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Caption area - vertical scroll only, no horizontal scroll */}
          <div className="flex-1 max-w-md text-center lg:text-left flex flex-col min-w-0 overflow-hidden">
            {(entry.title || entry.caption) ? (
              <div className="max-h-[40vh] overflow-y-auto overflow-x-hidden pr-1 caption-modal-body">
                {entry.title ? (
                  <p className="font-serif text-xl lg:text-2xl text-stone-900 mb-2">{normalizePastedText(entry.title)}</p>
                ) : null}
                {entry.caption ? (
                  <p className="font-sans text-sm text-stone-600 leading-relaxed break-words whitespace-pre-wrap">
                    {normalizePastedText(entry.caption)}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-stone-400">Curated with care</p>
            )}
            <div className="mt-6 pt-4 border-t border-stone-200 flex-shrink-0">
              <p className="text-xs text-stone-400 uppercase tracking-widest">Style Forage</p>
            </div>
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      {lightboxIndex !== null && (
        <ImageLightbox
          imageUrls={imageUrls}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
};

// Shopping List View Component
interface ShoppingListViewProps {
  items: ShoppingItem[];
  clientName: string | null;
  onBack: () => void;
  onToggleChecked: (itemId: string, checked: boolean) => void;
}

const ShoppingListView: React.FC<ShoppingListViewProps> = ({ items, clientName, onBack, onToggleChecked }) => {
  const uncheckedItems = items.filter(item => !item.checked);
  const checkedItems = items.filter(item => item.checked);

  const renderItem = (item: ShoppingItem) => (
    <div
      key={item.id}
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-opacity ${
        item.checked ? 'border-stone-200 opacity-60' : 'border-stone-100'
      }`}
    >
      {/* Link Preview Image */}
      {item.linkPreview?.image && (
        <div className={`aspect-[16/9] w-full bg-stone-100 ${item.checked ? 'grayscale' : ''}`}>
          <img
            src={item.linkPreview.image}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
          />
        </div>
      )}

      <div className="p-4">
        {/* Checkbox and name row */}
        <div className="flex items-start gap-3">
          <Button
            onClick={() => onToggleChecked(item.id, !item.checked)}
            variant="ghost"
            size="icon"
            className={`mt-1 flex-shrink-0 h-auto w-auto p-0 ${
              item.checked ? 'text-sage-500' : 'text-stone-300 hover:text-sage-500'
            }`}
            aria-label={item.checked ? 'Mark as not purchased' : 'Mark as purchased'}
          >
            {item.checked ? <CheckSquare size={24} /> : <Square size={24} />}
          </Button>
          <div className="flex-1 min-w-0">
            {/* Item name */}
            <h3 className={`font-medium text-lg ${item.checked ? 'text-stone-400 line-through' : 'text-stone-900'}`}>
              {item.name}
            </h3>

            {/* Description or link preview description */}
            {(item.description || item.linkPreview?.description) && (
              <p className="text-stone-500 text-sm mt-2 line-clamp-2">
                {item.description || item.linkPreview?.description}
              </p>
            )}
          </div>
        </div>

        {/* Multiple Links */}
        {item.links && item.links.length > 0 && (
          <div className="mt-4 space-y-3 pl-9">
            {item.links.map((link, index) => (
              <div key={index} className="border-t border-stone-100 pt-3">
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
                    <span className="truncate max-w-[150px]">
                      {link.linkPreview?.siteName || (() => {
                        try { return new URL(link.url).hostname.replace('www.', ''); } catch { return 'Shop'; }
                      })()}
                    </span>
                  </div>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full border-2 transition-colors ${
                      item.checked
                        ? 'border-stone-200 text-stone-400'
                        : 'border-sage-500 text-sage-600 hover:bg-sage-50'
                    }`}
                  >
                    <ExternalLink size={14} />
                    {item.checked ? 'View' : 'Shop Now'}
                  </a>
                </div>
                {/* Link description */}
                {link.description && (
                  <p className="text-stone-600 text-sm mt-2 line-clamp-2">
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
            {/* Link info and button */}
            {item.link && (
              <div className="mt-4 flex items-center justify-between pl-9">
                <div className="flex items-center gap-2 text-stone-400 text-sm">
                  {item.linkPreview?.favicon && (
                    <img
                      src={item.linkPreview.favicon}
                      alt=""
                      className="w-4 h-4"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                  <span className="truncate max-w-[150px]">
                    {item.linkPreview?.siteName || (() => {
                      try { return new URL(item.link!).hostname; } catch { return 'Shop'; }
                    })()}
                  </span>
                </div>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full border-2 transition-colors ${
                    item.checked
                      ? 'border-stone-200 text-stone-400'
                      : 'border-sage-500 text-sage-600 hover:bg-sage-50'
                  }`}
                >
                  <ExternalLink size={14} />
                  {item.checked ? 'View' : 'Shop Now'}
                </a>
              </div>
            )}

            {/* Full URL display */}
            {item.link && (
              <p className="mt-3 ml-9 text-xs text-stone-400 break-all border-t border-stone-100 pt-3">
                {item.link}
              </p>
            )}
          </>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-100 flex-shrink-0 z-10">
        <div className="px-4 py-4 flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <ShoppingBag size={20} className="text-sage-600" />
            <div>
              <h1 className="font-serif text-lg text-stone-900">Shopping List</h1>
              {clientName && (
                <p className="text-xs text-stone-400">Curated for {clientName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-stone-400">
              <span className="text-sm font-medium">
                {uncheckedItems.length} of {items.length} remaining
              </span>
            </div>
            <Button
              onClick={onBack}
              variant="ghost"
              size="icon"
              aria-label="Close"
            >
              <X size={20} />
            </Button>
          </div>
        </div>
      </header>

      {/* Shopping List - scrollable */}
      <main className="flex-1 min-h-0 overflow-y-auto px-4 py-6 max-w-2xl mx-auto">
        {items.length > 0 && (
          <p className="text-xs text-stone-500 mb-4">Tap the box next to an item to mark it as purchased.</p>
        )}
        {items.length === 0 ? (
          <div className="text-center py-12 text-stone-500">
            <ShoppingBag size={48} className="mx-auto mb-4 opacity-50" />
            <p>No shopping items yet.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Unchecked items grouped by category */}
            {CATEGORY_ORDER.map((cat) => {
              const categoryItems = uncheckedItems.filter((item) => (item.category || 'uncategorized') === cat);
              if (categoryItems.length === 0) return null;

              return (
                <div key={cat}>
                  <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-4">
                    {CATEGORY_LABELS[cat]}
                  </h3>
                  <div className="space-y-4">
                    {categoryItems.map(renderItem)}
                  </div>
                </div>
              );
            })}

            {/* Purchased section */}
            {checkedItems.length > 0 && (
              <div className="pt-4 border-t border-stone-200">
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Check size={14} />
                  Purchased ({checkedItems.length})
                </h3>
                <div className="space-y-4">
                  {checkedItems.map(renderItem)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Back button */}
        <div className="mt-8 text-center">
          <Button
            onClick={onBack}
            variant="ghost"
            size="md"
            className="text-sage-600 hover:text-sage-700"
          >
            ← Back to Lookbook
          </Button>
        </div>
      </main>
    </div>
  );
};

// Shopping List Content (for mobile modal)
interface ShoppingListContentProps {
  items: ShoppingItem[];
  onToggleChecked: (itemId: string, checked: boolean) => void;
}

const ShoppingListContent: React.FC<ShoppingListContentProps> = ({ items, onToggleChecked }) => {
  const uncheckedItems = items.filter(item => !item.checked);
  const checkedItems = items.filter(item => item.checked);

  const renderItem = (item: ShoppingItem) => (
    <div
      key={item.id}
      className={`bg-stone-50 rounded-xl overflow-hidden transition-opacity ${
        item.checked ? 'opacity-60' : ''
      }`}
    >
      {/* Link Preview Image */}
      {item.linkPreview?.image && (
        <div className={`aspect-[16/9] w-full bg-stone-100 ${item.checked ? 'grayscale' : ''}`}>
          <img
            src={item.linkPreview.image}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
          />
        </div>
      )}

      <div className="p-3">
        <div className="flex items-start gap-3">
          <Button
            onClick={() => onToggleChecked(item.id, !item.checked)}
            variant="ghost"
            size="icon"
            className={`mt-0.5 flex-shrink-0 h-auto w-auto p-0 ${
              item.checked ? 'text-sage-500' : 'text-stone-300 hover:text-sage-500'
            }`}
          >
            {item.checked ? <CheckSquare size={20} /> : <Square size={20} />}
          </Button>
          <div className="flex-1 min-w-0">
            <h4 className={`font-medium text-sm ${item.checked ? 'text-stone-400 line-through' : 'text-stone-900'}`}>
              {item.name}
            </h4>
            
            {/* Description */}
            {item.description && (
              <p className="text-stone-500 text-xs mt-1 line-clamp-2">
                {item.description}
              </p>
            )}
            
            {/* Multiple Links */}
            {item.links && item.links.length > 0 && (
              <div className="mt-2 space-y-2">
                {item.links.map((link, index) => (
                  <div key={index} className="border-t border-stone-200 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-stone-400 text-xs">
                        {link.linkPreview?.favicon && (
                          <img
                            src={link.linkPreview.favicon}
                            alt=""
                            className="w-3 h-3"
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
                        className="inline-flex items-center gap-1 mt-1 text-xs text-sage-600 hover:text-sage-700"
                      >
                        <ExternalLink size={10} />
                        Shop
                      </a>
                    </div>
                    {/* Link description */}
                    {link.description && (
                      <p className="text-stone-600 text-xs mt-1 line-clamp-2">
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
              item.link && (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs text-sage-600 hover:text-sage-700"
                >
                  <ExternalLink size={12} />
                  Shop
                </a>
              )
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-stone-500">
        <ShoppingBag size={36} className="mx-auto mb-3 opacity-50" />
        <p className="text-sm">No shopping items yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-stone-500">Tap the box next to an item to mark it as purchased.</p>
      {/* Unchecked items grouped by category */}
      {CATEGORY_ORDER.map((cat) => {
        const categoryItems = uncheckedItems.filter((item) => (item.category || 'uncategorized') === cat);
        if (categoryItems.length === 0) return null;

        return (
          <div key={cat}>
            <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">
              {CATEGORY_LABELS[cat]}
            </h4>
            <div className="space-y-3">
              {categoryItems.map(renderItem)}
            </div>
          </div>
        );
      })}

      {/* Purchased section */}
      {checkedItems.length > 0 && (
        <div className="pt-4 border-t border-stone-200">
          <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Check size={12} />
            Purchased ({checkedItems.length})
          </h4>
          <div className="space-y-3">
            {checkedItems.map(renderItem)}
          </div>
        </div>
      )}
    </div>
  );
};

