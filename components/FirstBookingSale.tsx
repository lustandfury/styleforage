import React, { useState, useEffect, useCallback } from 'react';
import { Tag, Sparkles } from 'lucide-react';
import { Button } from './ui/Button';

/** Shared copy for the 20% offer — use in FirstBookingSale and BookingWizard. */
export const SALE_OFFER_LABEL = 'LIMITED TIME: Book your first appointment in the next 24hrs and get an extra 20% off.';

const STORAGE_KEYS = {
  firstSeen: 'sf_booking_sale_first_seen',
  offerEndsAt: 'sf_booking_sale_offer_ends_at',
  secondChanceUsed: 'sf_booking_sale_second_chance_used',
} as const;

const OFFER_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

function getStoredNumber(key: string): number | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(key);
  if (raw === null) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

function setStoredNumber(key: string, value: number): void {
  sessionStorage.setItem(key, String(value));
}

function getStoredBoolean(key: string): boolean {
  return sessionStorage.getItem(key) === '1';
}

function setStoredBoolean(key: string, value: boolean): void {
  sessionStorage.setItem(key, value ? '1' : '0');
}

export interface FirstBookingSaleState {
  /** Whether the 20% offer is currently active (within the 24hr window). */
  active: boolean;
  /** Unix ms when the current offer window ends. */
  offerEndsAt: number | null;
  /** Current countdown string (e.g. "23:14:05") for inline display. */
  countdown: string;
}

interface FirstBookingSaleProps {
  onStateChange: (state: FirstBookingSaleState) => void;
  /** 'banner' = full banner when active; 'inline' = no banner, parent shows timer near price. */
  variant?: 'banner' | 'inline';
}

/**
 * Initializes session storage for the first-booking sale on first visit.
 * Returns { offerEndsAt } so we know when the current window ends.
 */
function initSaleSession(): { offerEndsAt: number } {
  const now = Date.now();
  const existingFirstSeen = getStoredNumber(STORAGE_KEYS.firstSeen);
  if (existingFirstSeen === null) {
    setStoredNumber(STORAGE_KEYS.firstSeen, now);
    const endsAt = now + OFFER_DURATION_MS;
    setStoredNumber(STORAGE_KEYS.offerEndsAt, endsAt);
    return { offerEndsAt: endsAt };
  }
  const existingEndsAt = getStoredNumber(STORAGE_KEYS.offerEndsAt);
  const endsAt = existingEndsAt ?? existingFirstSeen + OFFER_DURATION_MS;
  if (existingEndsAt === null) setStoredNumber(STORAGE_KEYS.offerEndsAt, endsAt);
  return { offerEndsAt: endsAt };
}

/**
 * Formats remaining time as "HH:MM:SS" or "Expired".
 */
function formatCountdown(endsAt: number): string {
  const now = Date.now();
  const remaining = Math.max(0, Math.floor((endsAt - now) / 1000));
  if (remaining <= 0) return 'Expired';
  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;
  return [hours, minutes, seconds]
    .map((n) => String(n).padStart(2, '0'))
    .join(':');
}

export const FirstBookingSale: React.FC<FirstBookingSaleProps> = ({ onStateChange, variant = 'banner' }) => {
  const [offerEndsAt, setOfferEndsAt] = useState<number | null>(() => {
    const stored = getStoredNumber(STORAGE_KEYS.offerEndsAt);
    if (stored !== null) return stored;
    const { offerEndsAt: init } = initSaleSession();
    setStoredNumber(STORAGE_KEYS.offerEndsAt, init);
    return init;
  });

  const [secondChanceUsed, setSecondChanceUsed] = useState(() =>
    getStoredBoolean(STORAGE_KEYS.secondChanceUsed)
  );

  const [countdown, setCountdown] = useState(() =>
    offerEndsAt !== null ? formatCountdown(offerEndsAt) : '--:--:--'
  );

  const now = Date.now();
  const isActive = offerEndsAt !== null && now < offerEndsAt;
  const showSecondChanceButton =
    offerEndsAt !== null && now >= offerEndsAt && !secondChanceUsed;

  // Sync initial session if we didn't have stored endsAt (e.g. first load)
  useEffect(() => {
    const stored = getStoredNumber(STORAGE_KEYS.offerEndsAt);
    if (stored !== null && offerEndsAt === null) {
      setOfferEndsAt(stored);
    } else if (stored === null && getStoredNumber(STORAGE_KEYS.firstSeen) === null) {
      const { offerEndsAt: init } = initSaleSession();
      setStoredNumber(STORAGE_KEYS.offerEndsAt, init);
      setOfferEndsAt(init);
    }
  }, [offerEndsAt]);

  // Notify parent when active, endsAt, or countdown changes
  useEffect(() => {
    onStateChange({
      active: isActive,
      offerEndsAt: offerEndsAt ?? null,
      countdown: isActive ? countdown : '--:--:--',
    });
  }, [isActive, offerEndsAt, countdown, onStateChange]);

  // Countdown tick
  useEffect(() => {
    if (offerEndsAt === null || !isActive) return;
    const tick = () => {
      const next = formatCountdown(offerEndsAt);
      setCountdown(next);
      if (next === 'Expired') {
        setOfferEndsAt(null);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [offerEndsAt, isActive]);

  const claimSecondChance = useCallback(() => {
    const now = Date.now();
    const newEndsAt = now + OFFER_DURATION_MS;
    setStoredNumber(STORAGE_KEYS.offerEndsAt, newEndsAt);
    setStoredBoolean(STORAGE_KEYS.secondChanceUsed, true);
    setOfferEndsAt(newEndsAt);
    setSecondChanceUsed(true);
  }, []);

  if (isActive && variant === 'banner') {
    return (
      <div
        className="mb-6 sm:mb-8 rounded-2xl md:rounded-3xl border border-sage-200 bg-gradient-to-br from-sage-50 to-white p-4 sm:p-6 shadow-sm"
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 text-sage-700">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-200/80">
              <Tag size={20} aria-hidden />
            </span>
            <div>
              <span className="font-bold text-stone-900">Book your first appointment today and get an extra 20% off</span>
              <span className="block text-sm text-stone-600">
                Lock in this price within the next 24 hours.
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isActive && variant === 'inline') {
    return null;
  }

  if (showSecondChanceButton) {
    return (
      <div className="mb-6 sm:mb-8">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full sm:w-auto rounded-full border-sage-300 text-sage-800 hover:bg-sage-50 hover:border-sage-400"
          onClick={claimSecondChance}
        >
          <Tag size={18} className="mr-2" aria-hidden />
          {SALE_OFFER_LABEL} one more time
        </Button>
      </div>
    );
  }

  return null;
};
