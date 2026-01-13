/**
 * POST /api/upload/
 * Handle spreadsheet file upload
 * Validates file type and size, stores temporarily, returns preview
 * NO HEAVY PROCESSING - only minimal validation and preview
 */

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getClientIp } from '@/lib/ip';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { cleanupOldTempFiles, saveTempFile } from '@/lib/tmpFiles';
import { storeFile } from '@/lib/storage';
import { MAX_FILE_BYTES, ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES } from '@/lib/limits';
import { ERRORS } from '@/lib/errors';
import { generatePreview } from '@/lib/analyzer';
import { createSession, setSessionCookie, getSessionFromCookie } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    // Cleanup old temp files
    await cleanupOldTempFiles();

    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitCheck = checkRateLimit(ip, RATE_LIMITS.LIGHT);
    if (!rateLimitCheck.allowed) {
      const { json, status } = ERRORS.RATE_LIMIT(rateLimitCheck.remaining);
      return NextResponse.json(json, { status });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    // Validate file exists
    if (!file) {
      const { json, status } = ERRORS.INVALID_FILE_TYPE();
      return NextResponse.json(json, { status });
    }

    // Validate file is not empty
    if (file.size === 0) {
      const { json, status } = ERRORS.EMPTY_FILE();
      return NextResponse.json(json, { status });
    }

    // Validate file type
    const isValidType = ALLOWED_MIME_TYPES.includes(file.type) || 
                        ALLOWED_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!isValidType) {
      const { json, status } = ERRORS.INVALID_FILE_TYPE();
      return NextResponse.json(json, { status });
    }

    // Validate file size
    if (file.size > MAX_FILE_BYTES) {
      const { json, status } = ERRORS.FILE_TOO_LARGE('10MB');
      return NextResponse.json(json, { status });
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Check if user has an existing paid session (for re-upload after payment)
    const existingSession = await getSessionFromCookie();
    const isPaidReupload = existingSession?.paid === true;

    // Generate unique file ID
    const fileId = uuidv4();

    // Store file in memory (works within same function invocation on Vercel)
    storeFile(fileId, file.name, buffer);
    
    // Also save to /tmp as backup (though it may not persist between invocations)
    try {
      await saveTempFile(fileId, buffer);
    } catch (error) {
      // If /tmp write fails, that's okay - we have in-memory storage
      console.warn('[Upload] Failed to save to /tmp, using in-memory storage only:', error);
    }

    // Generate preview analysis (minimal - no heavy processing)
    let preview;
    try {
      preview = generatePreview(buffer, fileId, file.name, file.size);
    } catch (parseError) {
      const { json, status } = ERRORS.PARSE_ERROR();
      return NextResponse.json(json, { status });
    }

    // Create session token (preserve paid status if re-uploading after payment)
    const token = await createSession({
      fileId,
      fileName: file.name,
      paid: isPaidReupload, // Preserve paid status if user already paid
      selectedKeyColumn: existingSession?.selectedKeyColumn, // Preserve key column selection
    });

    // Set session cookie
    await setSessionCookie(token);

    return NextResponse.json({
      ok: true,
      preview,
    });

  } catch (error) {
    console.error('[Upload] Error:', error);
    const { json, status } = ERRORS.INTERNAL('Failed to process upload');
    return NextResponse.json(json, { status });
  }
}
