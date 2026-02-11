/** When set, service has Online ($) and In-person ($) options. */
export interface PriceVariants {
  online: number;
  inPerson: number;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  features?: string[];
  price: number;
  durationMin: number;
  image: string;
  /** Online vs in-person pricing; when set, price is the minimum (e.g. online). */
  priceVariants?: PriceVariants;
  /** Short explanation of what Online vs In-person means for this service; shown in booking when a variant is selected. */
  variantDescriptions?: { online: string; inPerson: string };
  /** Optional badge label (e.g. "Most Popular") displayed on the service card. */
  badge?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export type ServiceVariant = 'online' | 'inPerson';

export interface BookingState {
  step: 'service' | 'date' | 'details' | 'payment' | 'confirmation';
  selectedService: Service | null;
  /** Set when selectedService has priceVariants (Online vs In-person). */
  selectedVariant?: ServiceVariant;
  selectedDate: Date | null;
  selectedTimes: string[];
  customerDetails: {
    name: string;
    email: string;
    phone: string;
    notes: string;
  };
}

export enum MessageRole {
  USER = 'user',
  MODEL = 'model'
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
}