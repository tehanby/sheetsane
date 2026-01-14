/**
 * POST /api/analyze/
 * Run full analysis on uploaded file
 * Only accessible after payment is confirmed
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/session';
import { getClientIp } from '@/lib/ip';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { cleanupOldTempFiles, readTempFile } from '@/lib/tmpFiles';
import { ERRORS } from '@/lib/errors';
import { analyzeWorkbook } from '@/lib/analyzer';
import { storeAnalysisResult, getAnalysisResult, getFile } from '@/lib/storage';
import { downloadFromR2, isR2Configured } from '@/lib/r2-storage';

export async function POST(request: NextRequest) {
  try {
    // Cleanup old temp files
    await cleanupOldTempFiles();

    // Rate limiting (heavy endpoint)
    const ip = getClientIp(request);
    const rateLimitCheck = checkRateLimit(ip, RATE_LIMITS.HEAVY);
    if (!rateLimitCheck.allowed) {
      const { json, status } = ERRORS.RATE_LIMIT(rateLimitCheck.remaining);
      return NextResponse.json(json, { status });
    }

    // Verify session
    const session = await getSessionFromCookie();
    
    if (!session) {
      const { json, status } = ERRORS.SESSION_EXPIRED();
      return NextResponse.json(json, { status });
    }

    // PAID GATE: Require payment before heavy processing
    if (!session.paid) {
      const { json, status } = ERRORS.PAYMENT_REQUIRED();
      return NextResponse.json(json, { status });
    }

    // Check if already analyzed
    const existingResult = getAnalysisResult(session.fileId);
    if (existingResult) {
      return NextResponse.json({
        ok: true,
        result: existingResult,
      });
    }

    // Get file from storage (try in-memory first, then R2, then /tmp)
    let buffer: Buffer | null = null;
    
    // Try in-memory storage first (works within same function invocation)
    const storedFile = getFile(session.fileId);
    if (storedFile) {
      buffer = storedFile.buffer;
    } else if (isR2Configured()) {
      // Try R2 storage (persists across invocations)
      try {
        buffer = await downloadFromR2(session.fileId);
      } catch (error) {
        console.error('[Analyze] R2 download failed:', error);
        // Continue to fallback
      }
    }
    
    if (!buffer) {
      // Fallback to /tmp (may not persist on Vercel between invocations)
      buffer = await readTempFile(session.fileId);
    }
    
    if (!buffer) {
      // If session is paid but file is missing, allow re-upload
      const { json, status } = ERRORS.FILE_MISSING_REUPLOAD(session.fileName);
      return NextResponse.json(json, { status });
    }

    // Run full analysis (with limits enforced in analyzer)
    const result = analyzeWorkbook(
      buffer,
      session.fileId,
      session.fileName,
      session.selectedKeyColumn
    );

    // Store result
    storeAnalysisResult(session.fileId, result);

    return NextResponse.json({
      ok: true,
      result,
    });

  } catch (error) {
    console.error('[Analyze] Error:', error);
    const { json, status } = ERRORS.INTERNAL('Failed to analyze file');
    return NextResponse.json(json, { status });
  }
}

/**
 * GET /api/analyze/
 * Get existing analysis result
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitCheck = checkRateLimit(ip, RATE_LIMITS.HEAVY);
    if (!rateLimitCheck.allowed) {
      const { json, status } = ERRORS.RATE_LIMIT(rateLimitCheck.remaining);
      return NextResponse.json(json, { status });
    }

    const session = await getSessionFromCookie();
    
    if (!session) {
      const { json, status } = ERRORS.SESSION_EXPIRED();
      return NextResponse.json(json, { status });
    }

    if (!session.paid) {
      const { json, status } = ERRORS.PAYMENT_REQUIRED();
      return NextResponse.json(json, { status });
    }

    const result = getAnalysisResult(session.fileId);
    
    if (!result) {
      const { json, status } = ERRORS.NOT_FOUND('Analysis');
      return NextResponse.json(json, { status });
    }

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    console.error('[Analyze GET] Error:', error);
    const { json, status } = ERRORS.INTERNAL('Failed to get analysis');
    return NextResponse.json(json, { status });
  }
}
