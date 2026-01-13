/**
 * POST /api/webhook/
 * Stripe webhook handler for payment confirmations
 */

import { NextRequest, NextResponse } from 'next/server';
import { constructWebhookEvent, stripe } from '@/lib/stripe';
import { confirmPayment, isSessionPaid } from '@/lib/payment-confirmations';
import Stripe from 'stripe';

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
