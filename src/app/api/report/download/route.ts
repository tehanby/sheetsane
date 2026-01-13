/**
 * GET /api/report/download/
 * Generate and download PDF report
 * Requires valid paid session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/session';
import { getClientIp } from '@/lib/ip';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { cleanupOldTempFiles, readTempFile, deleteTempFile } from '@/lib/tmpFiles';
import { ERRORS } from '@/lib/errors';
import { getAnalysisResult } from '@/lib/storage';
import { analyzeWorkbook } from '@/lib/analyzer';
import { generatePDFReport } from '@/lib/pdf-generator';

export async function GET(request: NextRequest) {
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

    // PAID GATE: Require payment before PDF generation
    if (!session.paid) {
      const { json, status } = ERRORS.PAYMENT_REQUIRED();
      return NextResponse.json(json, { status });
    }

    // Get or generate analysis result
    let result = getAnalysisResult(session.fileId);
    
    if (!result) {
      // Try to regenerate from temp file
      const buffer = await readTempFile(session.fileId);
      
      if (!buffer) {
        const { json, status } = ERRORS.FILE_EXPIRED();
        return NextResponse.json(json, { status });
      }

      result = analyzeWorkbook(
        buffer,
        session.fileId,
        session.fileName,
        session.selectedKeyColumn
      );
    }

    // Generate PDF
    const pdfBuffer = await generatePDFReport(result);

    // Create filename
    const safeName = session.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `SheetSane_Report_${safeName}_${Date.now()}.pdf`;

    // Return PDF as download (convert Buffer to Uint8Array for NextResponse)
    const response = new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

    // Cleanup PDF temp file after streaming (fire and forget)
    // Note: In practice, PDF is generated in memory, but if we save it to temp,
    // we'd delete it here. For now, we just ensure cleanup happens.

    return response;

  } catch (error) {
    console.error('[Report Download] Error:', error);
    const { json, status } = ERRORS.INTERNAL('Failed to generate report');
    return NextResponse.json(json, { status });
  }
}
