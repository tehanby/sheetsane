/**
 * POST /api/checkout/
 * Create Stripe Checkout session for report purchase
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie, createSession, setSessionCookie } from '@/lib/session';
import { getClientIp } from '@/lib/ip';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { cleanupOldTempFiles, readTempFile } from '@/lib/tmpFiles';
import { fileExists, getFile } from '@/lib/storage';
import { downloadFromR2, isR2Configured } from '@/lib/r2-storage';
import { ERRORS } from '@/lib/errors';
import { createCheckoutSession } from '@/lib/stripe';

interface CheckoutRequestBody {
  selectedKeyColumn?: {
    sheet: string;
    column: string;
    columnIndex: number;
  };
}

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

    // Verify session exists
    const session = await getSessionFromCookie();
    
    if (!session) {
      const { json, status } = ERRORS.SESSION_EXPIRED();
      return NextResponse.json(json, { status });
    }

    // Check if file still exists (try in-memory first, then R2, then /tmp)
    const storedFile = getFile(session.fileId);
    let fileExists = !!storedFile;
    
    if (!fileExists && isR2Configured()) {
      // Check R2 storage
      try {
        const r2Buffer = await downloadFromR2(session.fileId);
        fileExists = !!r2Buffer;
      } catch (error) {
        console.error('[Checkout] R2 check failed:', error);
      }
    }
    
    if (!fileExists) {
      // Check /tmp fallback
      const tempBuffer = await readTempFile(session.fileId);
      fileExists = !!tempBuffer;
    }
    
    if (!fileExists) {
      const { json, status } = ERRORS.FILE_EXPIRED();
      return NextResponse.json(json, { status });
    }

    // Get selected key column from request body (optional)
    let selectedKeyColumn = session.selectedKeyColumn;
    try {
      const body: CheckoutRequestBody = await request.json();
      if (body.selectedKeyColumn) {
        selectedKeyColumn = body.selectedKeyColumn;
      }
    } catch {
      // Body parsing failed, use existing selection
    }

    // Update session with key column selection
    if (selectedKeyColumn !== session.selectedKeyColumn) {
      const newToken = await createSession({
        fileId: session.fileId,
        fileName: session.fileName,
        paid: session.paid,
        selectedKeyColumn,
      });
      await setSessionCookie(newToken);
    }

    // Create Stripe Checkout session
    const checkoutSession = await createCheckoutSession(
      session.fileId,
      session.fileName
    );

    return NextResponse.json({
      ok: true,
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    });

  } catch (error) {
    console.error('[Checkout] Error:', error);
    const { json, status } = ERRORS.INTERNAL('Failed to create checkout session');
    return NextResponse.json(json, { status });
  }
}
