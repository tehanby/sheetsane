/**
 * Stripe Configuration and Helpers
 */

import Stripe from 'stripe';

// Lazy initialization of Stripe to avoid build-time errors
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
      typescript: true,
    });
  }
  return stripeInstance;
}

// Export stripe getter
export const stripe = {
  get instance() {
    return getStripe();
  },
  checkout: {
    sessions: {
      create: (params: Stripe.Checkout.SessionCreateParams) => 
        getStripe().checkout.sessions.create(params),
      retrieve: (id: string) => 
        getStripe().checkout.sessions.retrieve(id),
    },
  },
  webhooks: {
    constructEvent: (payload: string | Buffer, sig: string, secret: string) =>
      getStripe().webhooks.constructEvent(payload, sig, secret),
  },
};

// Price in cents
export const REPORT_PRICE_CENTS = 1900; // $19.00

/**
 * Create a Stripe Checkout Session for report purchase
 */
export async function createCheckoutSession(
  fileId: string,
  fileName: string
): Promise<Stripe.Checkout.Session> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Spreadsheet Sanity Report',
            description: `Analysis report for: ${fileName}`,
          },
          unit_amount: REPORT_PRICE_CENTS,
        },
        quantity: 1,
      },
    ],
    metadata: {
      fileId,
      fileName,
    },
    success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/checkout/cancel/`,
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
  });

  return session;
}

/**
 * Verify webhook signature
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
