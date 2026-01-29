import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import Stripe from 'stripe';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    console.error('STRIPE_SECRET_KEY is not configured');
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Payment service unavailable',
        message: 'Payment processing is currently unavailable. Please try again later.',
      }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { amount, currency = 'cad', metadata } = body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Valid amount is required' }),
      };
    }

    const stripe = new Stripe(stripeSecretKey);

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects amounts in cents
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        service: metadata?.service || '',
        date: metadata?.date || '',
        times: metadata?.times || '',
        customerName: metadata?.customerName || '',
        customerEmail: metadata?.customerEmail || '',
      },
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientSecret: paymentIntent.client_secret,
      }),
    };
  } catch (error) {
    console.error('Stripe API Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Payment error',
        message: 'Unable to process payment. Please try again.',
      }),
    };
  }
};

export { handler };
