/**
 * POST /api/verify-payment/
 * Verify Stripe payment and update session to paid status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie, markSessionAsPaid } from '@/lib/session';
import { getClientIp } from '@/lib/ip';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
// Note: We don't need to check temp files here - payment verification
// doesn't require the file to exist, only analysis does
import { ERRORS } from '@/lib/errors';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting (light endpoint)
    const ip = getClientIp(request);
    const rateLimitCheck = checkRateLimit(ip, RATE_LIMITS.LIGHT);
    if (!rateLimitCheck.allowed) {
      const { json, status } = ERRORS.RATE_LIMIT(rateLimitCheck.remaining);
      return NextResponse.json(json, { status });
    }

    const { sessionId } = await request.json();

    if (!sessionId) {
      const { json, status } = ERRORS.INTERNAL('Missing session ID');
      return NextResponse.json(json, { status });
    }

    // Get current session
    const session = await getSessionFromCookie();
    
    if (!session) {
      const { json, status } = ERRORS.SESSION_EXPIRED();
      return NextResponse.json(json, { status });
    }

    // If already paid, just return success
    if (session.paid) {
      return NextResponse.json({
        ok: true,
        paid: true,
      });
    }

    // Verify with Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json({
        ok: false,
        paid: false,
        code: 'PAYMENT_NOT_COMPLETE',
        error: 'Payment not completed',
      });
    }

    // Verify file ID matches
    if (checkoutSession.metadata?.fileId !== session.fileId) {
      const { json, status } = ERRORS.INTERNAL('Session mismatch');
      return NextResponse.json(json, { status });
    }

    // Note: We don't check if file exists here because:
    // 1. On Vercel, /tmp is ephemeral and may not persist between invocations
    // 2. Payment verification doesn't need the file - we only need it for analysis
    // 3. If file is missing during analysis, user will get a clear error then

    // Mark session as paid
    await markSessionAsPaid(session);

    return NextResponse.json({
      ok: true,
      paid: true,
    });

  } catch (error) {
    console.error('[Verify Payment] Error:', error);
    const { json, status } = ERRORS.INTERNAL('Failed to verify payment');
    return NextResponse.json(json, { status });
  }
}
