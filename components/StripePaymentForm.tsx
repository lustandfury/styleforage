import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from './ui/Button';
import { Lock, AlertCircle } from 'lucide-react';

// Load Stripe outside of component to avoid recreating on every render
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface PaymentFormProps {
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
  metadata?: {
    service?: string;
    date?: string;
    times?: string;
    customerName?: string;
    customerEmail?: string;
  };
}

// Inner form component that uses Stripe hooks
const CheckoutForm: React.FC<{
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}> = ({ amount, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/book/confirmation`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setErrorMessage(error.message || 'An error occurred during payment.');
      onError(error.message || 'Payment failed');
      setIsProcessing(false);
    } else {
      // Payment succeeded
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement 
        options={{
          layout: 'tabs',
        }}
      />
      
      {errorMessage && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm">
          <AlertCircle size={18} />
          {errorMessage}
        </div>
      )}

      <div className="text-center text-stone-400 flex items-center justify-center gap-2">
        <Lock size={14} /> 
        <span className="text-xs font-medium uppercase tracking-widest">Secured by Stripe</span>
      </div>

      <Button 
        type="submit"
        size="lg"
        className="w-full py-6 rounded-full text-xl shadow-xl shadow-sage-500/20"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? 'Processing...' : `Confirm & Pay $${amount}`}
      </Button>
    </form>
  );
};

// Main component that wraps with Elements provider
export const StripePaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  onSuccess,
  onError,
  metadata,
}) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    // Create PaymentIntent on component mount
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount,
            currency: 'cad',
            metadata,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to initialize payment');
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error('Payment initialization error:', error);
        setInitError('Unable to initialize payment. Please try again.');
        onError('Payment initialization failed');
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [amount, metadata, onError]);

  if (isLoading) {
    return (
      <div className="bg-white p-10 rounded-3xl border border-stone-100 shadow-xl">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-10 h-10 border-4 border-sage-200 border-t-sage-500 rounded-full animate-spin mb-4"></div>
          <p className="text-stone-500 text-sm">Initializing secure payment...</p>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="bg-white p-10 rounded-3xl border border-stone-100 shadow-xl">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle size={48} className="text-red-400 mb-4" />
          <p className="text-stone-700 font-medium mb-2">Payment Unavailable</p>
          <p className="text-stone-500 text-sm">{initError}</p>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return null;
  }

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#1c1917',
      colorBackground: '#fafaf9',
      colorText: '#1c1917',
      colorDanger: '#ef4444',
      fontFamily: 'Inter, system-ui, sans-serif',
      borderRadius: '16px',
      spacingUnit: '4px',
    },
    rules: {
      '.Input': {
        border: '2px solid #f5f5f4',
        backgroundColor: '#fafaf9',
        padding: '16px',
      },
      '.Input:focus': {
        border: '2px solid #8cae8c',
        boxShadow: '0 0 0 1px #8cae8c',
      },
      '.Label': {
        fontSize: '12px',
        fontWeight: '700',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.1em',
        color: '#a8a29e',
      },
    },
  };

  return (
    <div className="bg-white p-10 rounded-3xl border border-stone-100 shadow-xl">
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance,
        }}
      >
        <CheckoutForm 
          amount={amount} 
          onSuccess={onSuccess} 
          onError={onError} 
        />
      </Elements>
    </div>
  );
};
