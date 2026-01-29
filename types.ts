export interface Service {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  features?: string[];
  price: number;
  durationMin: number;
  image: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface BookingState {
  step: 'service' | 'date' | 'details' | 'payment' | 'confirmation';
  selectedService: Service | null;
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