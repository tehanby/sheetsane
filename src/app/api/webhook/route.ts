/**
 * POST /api/webhook/
 * Stripe webhook handler for payment confirmations
 */

import { NextRequest, NextResponse } from 'next/server';
import { constructWebhookEvent, stripe } from '@/lib/stripe';
import Stripe from 'stripe';

// Store payment confirmations (in production, use Redis or similar)
// Maps Stripe session ID to fileId
const paymentConfirmations = new Map<string, { fileId: string; fileName: string; confirmedAt: number }>();

// Cleanup old confirmations (keep for 1 hour)
const CONFIRMATION_EXPIRY = 60 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [sessionId, data] of paymentConfirmations.entries()) {
    if (now - data.confirmedAt > CONFIRMATION_EXPIRY) {
      paymentConfirmations.delete(sessionId);
    }
  }
}, 5 * 60 * 1000);

/**
 * Verify if a Stripe session was paid
 */
export function isSessionPaid(stripeSessionId: string): { fileId: string; fileName: string } | null {
  return paymentConfirmations.get(stripeSessionId) || null;
}

/**
 * Add a confirmed payment (called from webhook or verify endpoint)
 */
export function confirmPayment(stripeSessionId: string, fileId: string, fileName: string): void {
  paymentConfirmations.set(stripeSessionId, {
    fileId,
    fileName,
    confirmedAt: Date.now(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;
    
    try {
      event = constructWebhookEvent(body, signature);
    } catch (err) {
      console.error('[Webhook] Signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      if (session.payment_status === 'paid') {
        const fileId = session.metadata?.fileId;
        const fileName = session.metadata?.fileName;
        
        if (fileId && fileName) {
          confirmPayment(session.id, fileId, fileName);
          console.log(`[Webhook] Payment confirmed for file: ${fileId}`);
        }
      }
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('[Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhook/?session_id=xxx
 * Verify payment status directly from Stripe (backup for webhook)
 */
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('session_id');
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing session_id' },
        { status: 400 }
      );
    }

    // Check our local cache first
    const cached = isSessionPaid(sessionId);
    if (cached) {
      return NextResponse.json({
        paid: true,
        fileId: cached.fileId,
        fileName: cached.fileName,
      });
    }

    // Verify with Stripe directly
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === 'paid') {
      const fileId = session.metadata?.fileId;
      const fileName = session.metadata?.fileName;
      
      if (fileId && fileName) {
        confirmPayment(sessionId, fileId, fileName);
        
        return NextResponse.json({
          paid: true,
          fileId,
          fileName,
        });
      }
    }

    return NextResponse.json({
      paid: false,
    });

  } catch (error) {
    console.error('[Webhook GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
