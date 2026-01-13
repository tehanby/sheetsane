/**
 * Temporary File Management
 * Handles saving, retrieving, and cleaning up temp files in /tmp directory
 */

import { writeFile, readFile, unlink, readdir, stat } from 'fs/promises';
import { join } from 'path';
import { TTL_MS } from './limits';

// Get temp directory (Vercel-compatible)
const TMP_DIR = process.env.TMPDIR || '/tmp';

/**
 * Get full path for temp file
 */
function getTempPath(fileId: string, suffix: string = ''): string {
  return join(TMP_DIR, `sheetsane_${fileId}${suffix}`);
}

/**
 * Save file to temp directory
 */
export async function saveTempFile(
  fileId: string,
  buffer: Buffer,
  suffix: string = ''
): Promise<string> {
  const path = getTempPath(fileId, suffix);
  await writeFile(path, buffer);
  return path;
}

/**
 * Read file from temp directory
 */
export async function readTempFile(fileId: string, suffix: string = ''): Promise<Buffer | null> {
  try {
    const path = getTempPath(fileId, suffix);
    return await readFile(path);
  } catch (error) {
    // File doesn't exist
    return null;
  }
}

/**
 * Delete temp file
 */
export async function deleteTempFile(fileId: string, suffix: string = ''): Promise<boolean> {
  try {
    const path = getTempPath(fileId, suffix);
    await unlink(path);
    return true;
  } catch (error) {
    // File doesn't exist or already deleted
    return false;
  }
}

/**
 * Clean up old temp files (older than TTL)
 * Should be called at the start of relevant API handlers
 */
export async function cleanupOldTempFiles(): Promise<number> {
  let deletedCount = 0;
  const now = Date.now();

  try {
    const files = await readdir(TMP_DIR);
    const sheetsaneFiles = files.filter(f => f.startsWith('sheetsane_'));

    for (const file of sheetsaneFiles) {
      const filePath = join(TMP_DIR, file);
      try {
        const stats = await stat(filePath);
        const age = now - stats.mtimeMs;

        if (age > TTL_MS) {
          await unlink(filePath);
          deletedCount++;
        }
      } catch (error) {
        // File may have been deleted already, skip
      }
    }
  } catch (error) {
    // Directory may not exist or be inaccessible, that's okay
    console.warn('[TmpFiles] Cleanup error:', error);
  }

  if (deletedCount > 0) {
    console.log(`[TmpFiles] Cleaned up ${deletedCount} old temp file(s)`);
  }

  return deletedCount;
}

/**
 * Get temp file path (for direct access if needed)
 */
export function getTempFilePath(fileId: string, suffix: string = ''): string {
  return getTempPath(fileId, suffix);
}
