/**
 * POST /api/verify-payment/
 * Verify Stripe payment and update session to paid status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie, markSessionAsPaid } from '@/lib/session';
import { getClientIp } from '@/lib/ip';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { cleanupOldTempFiles, readTempFile } from '@/lib/tmpFiles';
import { ERRORS } from '@/lib/errors';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    // Cleanup old temp files
    await cleanupOldTempFiles();

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

    // Verify file still exists in temp storage
    const buffer = await readTempFile(session.fileId);
    if (!buffer) {
      const { json, status } = ERRORS.FILE_EXPIRED();
      return NextResponse.json(json, { status });
    }

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
